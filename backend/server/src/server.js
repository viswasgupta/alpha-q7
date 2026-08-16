import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { z } from 'zod';
import { readDb, writeDb, appendAuditLog } from './store.js';
import { ensureAdmin, login, logout, requireAuth } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const publicDir = path.join(root, 'frontend', 'public');
const uploadDir = path.join(__dirname, '../uploads');

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) { throw new Error('DATABASE_URL is required in production.'); }

const app = express();

app.use((req, res, next) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  req.requestId = requestId;
  res.set('X-Request-ID', requestId);
  next();
});

const port = Number(process.env.PORT || 4000);
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters in production.');
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be configured in production.');
}
const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const trustedOrigins = new Set([origin, `http://localhost:${port}`]);
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.CLIENT_ORIGIN) throw new Error('CLIENT_ORIGIN must be configured in production.');

await fs.mkdir(uploadDir, { recursive: true });

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", 's3.tradingview.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 's3.tradingview.com', 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      frameSrc: ["'self'", 'tradingview.com', 'www.tradingview-widget.com', 's.tradingview.com'],
      connectSrc: ["'self'", 'tradingview.com', 's3.tradingview.com', 'www.tradingview-widget.com', 's.tradingview.com'],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  }
}));
app.use(cors({ origin: (requestOrigin, callback) => {
  if (!requestOrigin || trustedOrigins.has(requestOrigin)) return callback(null, true);
  return callback(new Error('CORS origin denied.'));
}, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','X-Request-ID'] }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('origin');
  const requestOrigin = `${req.protocol}://${req.get('host')}`;
  const secFetchSite = req.get('sec-fetch-site');
  // Browser mutations must originate from the configured/same origin.
  // In production, missing Origin is rejected for cookie-authenticated mutations.
  if (!origin) {
    if (isProduction && req.cookies?.alpha_q7_admin) return res.status(403).json({ message: 'Origin header required.' });
    return next();
  }
  if (secFetchSite === 'cross-site') return res.status(403).json({ message: 'Cross-site request blocked.' });
  if (trustedOrigins.has(origin) || origin === requestOrigin) return next();
  return res.status(403).json({ message: 'Invalid request origin.' });
});
app.use('/uploads', express.static(uploadDir));
app.use('/assets', express.static(path.join(publicDir, 'assets')));
app.use(express.static(publicDir));

function auditSafeBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return [];
  return Object.keys(body).filter(key => !['password', 'currentPassword', 'newPassword', 'token', 'jwt', 'passwordHash'].includes(key)).slice(0, 40);
}

app.use('/api', (req, res, next) => {
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!isMutation) return next();
  res.on('finish', () => {
    if (!req.user || req.path === '/auth/login' || req.path === '/auth/logout') return;
    const pathParts = req.path.split('/').filter(Boolean);
    const entity = pathParts[0] || 'api';
    appendAuditLog({
      adminUsername: req.user.username || 'unknown',
      role: req.user.role || 'unknown',
      action: `${req.method} ${req.path}`,
      entity,
      entityId: pathParts[1] || '',
      statusCode: res.statusCode,
      requestId: req.requestId,
      changedFields: auditSafeBody(req.body)
    }).catch(error => console.error('Audit log write failed:', error.message));
  });
  next();
});

const id = () => crypto.randomUUID();

const text = (max = 5000) => z.string().max(max);
const isSafeUrl = value => {
  if (!value || value.startsWith('#') || value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) return true;
  try { return ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(value).protocol); } catch { return false; }
};
const safeUrl = (max = 1000) => z.string().max(max).refine(isSafeUrl, 'Use a relative, HTTP(S), mailto, or tel URL.');
function isSafeContentValue(value, depth = 0) {
  if (depth > 10) return false;
  if (typeof value === 'string') return value.length <= 5000;
  if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) || value === null) return true;
  if (Array.isArray(value)) return value.length <= 500 && value.every(item => isSafeContentValue(item, depth + 1));
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    return entries.length <= 100 && entries.every(([key, item]) => key.length <= 120 && isSafeContentValue(item, depth + 1));
  }
  return false;
}
const leadAttempts = new Map();
function allowLeadSubmission(req) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (leadAttempts.get(key) || []).filter(time => now - time < 60 * 60 * 1000);
  if (recent.length >= 10) return false;
  leadAttempts.set(key, [...recent, now]);
  return true;
}
const itemSchema = z.object({ id: z.string(), title: z.string().min(1), text: z.string() });
const aboutCardSchema = z.object({ id: z.string(), number: z.string(), title: z.string().min(1), text: z.string() });
const analysisCardSchema = aboutCardSchema;
const courseSchema = z.object({
  id: z.string(), icon: z.string(), title: z.string().min(1), subtitle: z.string(),
  whatIs: z.string(), howWorks: z.string(),
  benefits: z.array(z.string()), whoCan: z.array(z.string())
});
const testimonialSchema = z.object({ id: z.string(), stars: z.string(), name: z.string().min(1), role: z.string(), text: z.string() });
const faqSchema = z.object({ id: z.string(), question: z.string().min(1), answer: z.string() });
const publicLeadSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  mobile: z.string().trim().min(7).max(30),
  email: z.string().trim().email().or(z.literal('')),
  experience: z.string().trim().max(120),
  source: z.string().trim().max(120).default('Masterclass Registration')
});

const contentSchema = z.object({
  site: z.object({ footer: z.unknown().optional() }).passthrough(),
  courses: z.array(courseSchema),
  learn: z.array(itemSchema),
  testimonials: z.array(testimonialSchema),
  faq: z.array(faqSchema)
});

const footerSchema = z.object({
  description: text(2000),
  logoSrc: safeUrl(500),
  logoAlt: text(200),
  contactTitle: text(120),
  contact: z.object({
    whatsapp: text(40), phone: text(80), email: text(200),
    address: text(1000), mapUrl: safeUrl(1000)
  }),
  columns: z.array(z.object({
    id: z.string(), title: z.string().min(1).max(120),
    links: z.array(z.object({
      id: z.string(), label: z.string().min(1).max(120),
      url: safeUrl(1000), target: z.enum(['_self', '_blank'])
    }))
  })),
  socials: z.array(z.object({
    id: z.string(), type: z.string().min(1).max(40),
    label: z.string().min(1).max(120), url: safeUrl(1000)
  })),
  qrImage: text(1000),
  bottom: z.object({
    copyright: text(300), disclaimer: text(500),
    legalLinks: z.array(z.object({
      id: z.string(), label: z.string().min(1).max(120),
      url: safeUrl(1000), target: z.enum(['_self', '_blank'])
    }))
  })
});

function normalizeFooter(footer = {}) {
  return {
    description: footer.description || '',
    logoSrc: footer.logoSrc || '/assets/alpha-q7-logo.png',
    logoAlt: footer.logoAlt || 'Alpha Q7 Trading Institute',
    contactTitle: footer.contactTitle || 'Contact',
    contact: {
      whatsapp: footer.contact?.whatsapp || '917353228777',
      phone: footer.contact?.phone || '+91 73532 28777',
      email: footer.contact?.email || '',
      address: footer.contact?.address || '',
      mapUrl: footer.contact?.mapUrl || ''
    },
    columns: Array.isArray(footer.columns) ? footer.columns : [],
    socials: Array.isArray(footer.socials) ? footer.socials : [],
    qrImage: footer.qrImage || '',
    bottom: {
      copyright: footer.bottom?.copyright || '',
      disclaimer: footer.bottom?.disclaimer || '',
      legalLinks: Array.isArray(footer.bottom?.legalLinks) ? footer.bottom.legalLinks : []
    }
  };
}

const defaultWhyAlpha = {
  eyebrow: 'WHY ALPHA Q7',
  title: 'Why You Should Choose Alpha Q7',
  subtitle: '',
  alphaHeading: 'Alpha Q7',
  otherHeading: 'Other Trading Institutes',
  comparisons: [
    { id: 'why-1', alpha: '✅ Practical, market-focused learning', other: '📚 Mostly theory-based learning' },
    { id: 'why-2', alpha: '📊 Learn to analyze the market yourself', other: '📢 Depend heavily on tips/signals' },
    { id: 'why-3', alpha: '🎯 Focus on strategy + risk management', other: '💰 Often focus mainly on profits' },
    { id: 'why-4', alpha: '👨‍🏫 Guidance from experienced mentors', other: '🎥 Limited personal guidance' },
    { id: 'why-5', alpha: '📈 Real-market examples and trade analysis', other: '📝 Mostly pre-recorded content' },
    { id: 'why-6', alpha: '🤝 Ongoing learning & community support', other: '❌ Support may end after the course' },
    { id: 'why-7', alpha: '🧠 Build your own trading confidence', other: "🔄 Depend on someone else's calls" }
  ],
  differenceTitle: 'What Makes Alpha Q7 Different?',
  journey: 'Learn → Practice → Analyze → Improve',
  description: 'At Alpha Q7, our goal is not to make you dependent on calls or tips. We help you develop the knowledge, discipline, strategy and risk-management skills needed to make informed trading decisions.',
  highlights: [
    { id: 'highlight-1', title: 'Practical, Market-Focused Learning', text: 'Learn through practical market concepts, analysis and real trading situations.' },
    { id: 'highlight-2', title: 'Learn to Analyze the Market Yourself', text: 'Build the knowledge and confidence to understand charts, market structure and opportunities independently.' },
    { id: 'highlight-3', title: 'Strategy & Risk Management', text: 'Develop disciplined trading strategies while learning responsible risk management and capital protection.' },
    { id: 'highlight-4', title: 'Real-Market Experience & Community Support', text: 'Learn from real-market examples, experienced guidance and an ongoing learning community that helps you grow with confidence.' }
  ],
  cta: 'Start your trading journey with Alpha Q7 today.'
};

async function getContent() {
  const db = await readDb();
  if (!db.content) {
    db.content = { site: {}, courses: [], learn: [], testimonials: [], faq: [] };
    await writeDb(db);
  }
  db.content.site = db.content.site || {};
  db.content.site.footer = normalizeFooter(db.content.site.footer || db.footer);
  db.content.site.whyAlpha ||= structuredClone(defaultWhyAlpha);
  const wa = db.content.site.whyAlpha;
  const legacyHighlights = Array.isArray(wa.highlights) && wa.highlights.length === 2 && wa.highlights.every(x => !x.title);
  if (wa.title === 'Why Choose Alpha Q7?' || legacyHighlights) {
    db.content.site.whyAlpha = {
      ...structuredClone(defaultWhyAlpha),
      ...wa,
      title: 'Why You Should Choose Alpha Q7',
      subtitle: '',
      journey: 'Learn → Practice → Analyze → Improve',
      description: 'At Alpha Q7, our goal is not to make you dependent on calls or tips. We help you develop the knowledge, discipline, strategy and risk-management skills needed to make informed trading decisions.',
      highlights: structuredClone(defaultWhyAlpha.highlights)
    };
    await writeDb(db);
  }
  return db.content;
}

const whyComparisonSchema = z.object({
  id: z.string(),
  alpha: z.string().min(1).max(1000),
  other: z.string().min(1).max(1000)
});
const whyHighlightSchema = z.object({
  id: z.string(),
  title: z.string().max(300).default(''),
  text: z.string().min(1).max(1000)
});
const whyAlphaSchema = z.object({
  eyebrow: z.string().max(200),
  title: z.string().max(300),
  subtitle: z.string().max(1000),
  alphaHeading: z.string().max(200),
  otherHeading: z.string().max(200),
  comparisons: z.array(whyComparisonSchema).max(100),
  differenceTitle: z.string().max(300),
  journey: z.string().max(500),
  description: z.string().max(5000),
  highlights: z.array(whyHighlightSchema).max(100),
  cta: z.string().max(500)
});

function publicContent(content) {
  return {
    site: content.site,
    courses: content.courses,
    learn: content.learn,
    testimonials: content.testimonials,
    faq: content.faq
  };
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'alpha-q7' }));
app.post('/api/auth/login', login);
app.post('/api/auth/logout', requireAuth, logout);
app.get('/api/auth/me', requireAuth, (req, res) =>
  res.json({ user: { username: req.user.username, role: req.user.role } })
);

/* =========================================================
   COMPLETE WEBSITE CONTENT
========================================================= */

app.get('/api/content/public', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(publicContent(await getContent()));
});

app.get('/api/content', requireAuth, async (_req, res) => {
  res.json(await getContent());
});

app.put('/api/content', requireAuth, async (req, res) => {
  const parsed = contentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid website content.', issues: parsed.error.issues });
  const db = await readDb();
  const incoming = parsed.data;
  if (!isSafeContentValue(incoming.site)) return res.status(400).json({ message: 'Website content exceeds supported limits.' });
  if (incoming.site.footer && !footerSchema.safeParse(incoming.site.footer).success) return res.status(400).json({ message: 'Invalid footer data.' });
  incoming.site.footer = normalizeFooter(incoming.site.footer);
  db.content = incoming;
  db.footer = incoming.site.footer;
  await writeDb(db);
  res.json(db.content);
});

async function arrayCrud(collection, schema, label) {
  return {
    post: async (req, res) => {
      const parsed = schema.safeParse({ ...req.body, id: id() });
      if (!parsed.success) return res.status(400).json({ message: `Invalid ${label}.`, issues: parsed.error.issues });
      const db = await readDb();
      db.content[collection] ||= [];
      db.content[collection].push(parsed.data);
      await writeDb(db);
      res.status(201).json(parsed.data);
    },
    put: async (req, res) => {
      const parsed = schema.safeParse({ ...req.body, id: req.params.id });
      if (!parsed.success) return res.status(400).json({ message: `Invalid ${label}.`, issues: parsed.error.issues });
      const db = await readDb();
      const list = db.content[collection] || [];
      const index = list.findIndex(x => x.id === req.params.id);
      if (index < 0) return res.status(404).json({ message: `${label} not found.` });
      list[index] = parsed.data;
      await writeDb(db);
      res.json(parsed.data);
    },
    del: async (req, res) => {
      const db = await readDb();
      const list = db.content[collection] || [];
      const next = list.filter(x => x.id !== req.params.id);
      if (next.length === list.length) return res.status(404).json({ message: `${label} not found.` });
      db.content[collection] = next;
      await writeDb(db);
      res.status(204).end();
    }
  };
}

for (const [collection, schema, label] of [
  ['courses', courseSchema, 'Course'],
  ['learn', itemSchema, 'Learning subject'],
  ['testimonials', testimonialSchema, 'Testimonial'],
  ['faq', faqSchema, 'FAQ']
]) {
  const crud = await arrayCrud(collection, schema, label);
  app.post(`/api/content/${collection}`, requireAuth, crud.post);
  app.put(`/api/content/${collection}/:id`, requireAuth, crud.put);
  app.delete(`/api/content/${collection}/:id`, requireAuth, crud.del);
}

/* About / analysis / section configuration */
app.get('/api/content/section/:section', requireAuth, async (req, res) => {
  const content = await getContent();
  if (!(req.params.section in content.site)) return res.status(404).json({ message: 'Section not found.' });
  res.json(content.site[req.params.section]);
});

app.put('/api/content/section/:section', requireAuth, async (req, res) => {
  const db = await readDb();
  if (!db.content?.site || !(req.params.section in db.content.site)) {
    return res.status(404).json({ message: 'Section not found.' });
  }
  if (!isSafeContentValue(req.body)) return res.status(400).json({ message: 'Invalid section data.' });
  if (req.params.section === 'footer' && !footerSchema.safeParse(req.body).success) return res.status(400).json({ message: 'Invalid footer data.' });
  db.content.site[req.params.section] = req.body;
  await writeDb(db);
  res.json(db.content.site[req.params.section]);
});

app.post('/api/content/section/:section/items', requireAuth, async (req, res) => {
  const db = await readDb();
  const section = db.content?.site?.[req.params.section];
  if (!section || !Array.isArray(section.cards)) return res.status(400).json({ message: 'This section does not support item CRUD.' });
  const parsed = aboutCardSchema.safeParse({ ...req.body, id: id() });
  if (!parsed.success) return res.status(400).json({ message: 'Invalid section item.' });
  const item = parsed.data;
  section.cards.push(item);
  await writeDb(db);
  res.status(201).json(item);
});

app.put('/api/content/section/:section/items/:id', requireAuth, async (req, res) => {
  const db = await readDb();
  const section = db.content?.site?.[req.params.section];
  if (!section || !Array.isArray(section.cards)) return res.status(400).json({ message: 'This section does not support item CRUD.' });
  const index = section.cards.findIndex(x => x.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Section item not found.' });
  const parsed = aboutCardSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) return res.status(400).json({ message: 'Invalid section item.' });
  section.cards[index] = parsed.data;
  await writeDb(db);
  res.json(section.cards[index]);
});

app.delete('/api/content/section/:section/items/:id', requireAuth, async (req, res) => {
  const db = await readDb();
  const section = db.content?.site?.[req.params.section];
  if (!section || !Array.isArray(section.cards)) return res.status(400).json({ message: 'This section does not support item CRUD.' });
  const next = section.cards.filter(x => x.id !== req.params.id);
  if (next.length === section.cards.length) return res.status(404).json({ message: 'Section item not found.' });
  section.cards = next;
  await writeDb(db);
  res.status(204).end();
});

/* =========================================================
   WHY ALPHA Q7 CMS
========================================================= */

app.get('/api/why-alpha', requireAuth, async (_req,res) => {
  const content = await getContent();
  res.json(content.site.whyAlpha);
});

app.put('/api/why-alpha', requireAuth, async (req,res) => {
  const parsed = whyAlphaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({message:'Invalid Why Alpha Q7 data.', issues:parsed.error.issues});
  const db = await readDb();
  db.content.site.whyAlpha = parsed.data;
  await writeDb(db);
  res.json(parsed.data);
});

app.post('/api/why-alpha/comparisons', requireAuth, async (req,res) => {
  const parsed = whyComparisonSchema.safeParse({...req.body,id:id()});
  if(!parsed.success)return res.status(400).json({message:'Invalid comparison.',issues:parsed.error.issues});
  const db=await readDb(); const section=db.content.site.whyAlpha ||= structuredClone(defaultWhyAlpha);
  section.comparisons ||= []; section.comparisons.push(parsed.data); await writeDb(db); res.status(201).json(parsed.data);
});
app.put('/api/why-alpha/comparisons/:id', requireAuth, async (req,res) => {
  const parsed=whyComparisonSchema.safeParse({...req.body,id:req.params.id});
  if(!parsed.success)return res.status(400).json({message:'Invalid comparison.',issues:parsed.error.issues});
  const db=await readDb(); const section=db.content.site.whyAlpha ||= structuredClone(defaultWhyAlpha);
  const i=section.comparisons.findIndex(x=>x.id===req.params.id); if(i<0)return res.status(404).json({message:'Comparison not found.'});
  section.comparisons[i]=parsed.data; await writeDb(db); res.json(parsed.data);
});
app.delete('/api/why-alpha/comparisons/:id', requireAuth, async (req,res) => {
  const db=await readDb(); const section=db.content.site.whyAlpha ||= structuredClone(defaultWhyAlpha);
  const next=section.comparisons.filter(x=>x.id!==req.params.id); if(next.length===section.comparisons.length)return res.status(404).json({message:'Comparison not found.'});
  section.comparisons=next; await writeDb(db); res.status(204).end();
});
app.post('/api/why-alpha/highlights', requireAuth, async (req,res) => {
  const parsed=whyHighlightSchema.safeParse({...req.body,id:id()});
  if(!parsed.success)return res.status(400).json({message:'Invalid highlight.',issues:parsed.error.issues});
  const db=await readDb(); const section=db.content.site.whyAlpha ||= structuredClone(defaultWhyAlpha);
  section.highlights ||= []; section.highlights.push(parsed.data); await writeDb(db); res.status(201).json(parsed.data);
});
app.put('/api/why-alpha/highlights/:id', requireAuth, async (req,res) => {
  const parsed=whyHighlightSchema.safeParse({...req.body,id:req.params.id});
  if(!parsed.success)return res.status(400).json({message:'Invalid highlight.',issues:parsed.error.issues});
  const db=await readDb(); const section=db.content.site.whyAlpha ||= structuredClone(defaultWhyAlpha);
  const i=section.highlights.findIndex(x=>x.id===req.params.id); if(i<0)return res.status(404).json({message:'Highlight not found.'});
  section.highlights[i]=parsed.data; await writeDb(db); res.json(parsed.data);
});
app.delete('/api/why-alpha/highlights/:id', requireAuth, async (req,res) => {
  const db=await readDb(); const section=db.content.site.whyAlpha ||= structuredClone(defaultWhyAlpha);
  const next=section.highlights.filter(x=>x.id!==req.params.id); if(next.length===section.highlights.length)return res.status(404).json({message:'Highlight not found.'});
  section.highlights=next; await writeDb(db); res.status(204).end();
});

/* =========================================================
   FOOTER CMS
========================================================= */

app.get('/api/footer/public', async (_req, res) => {
  const content = await getContent();
  res.set('Cache-Control', 'no-store');
  res.json(normalizeFooter(content.site.footer));
});

app.get('/api/footer', requireAuth, async (_req, res) => {
  const content = await getContent();
  res.json(normalizeFooter(content.site.footer));
});

app.put('/api/footer', requireAuth, async (req, res) => {
  const parsed = footerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid footer data.', issues: parsed.error.issues });
  const db = await readDb();
  db.content.site.footer = parsed.data;
  db.footer = parsed.data;
  await writeDb(db);
  res.json(parsed.data);
});

app.post('/api/footer/columns', requireAuth, async (req, res) => {
  const body = z.object({ title: z.string().min(1).max(120) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: 'Column title is required.' });
  const db = await readDb(); const footer = normalizeFooter(db.content.site.footer);
  const column = { id: id(), title: body.data.title, links: [] };
  footer.columns.push(column); db.content.site.footer = footer; db.footer = footer;
  await writeDb(db); res.status(201).json(column);
});
app.put('/api/footer/columns/:columnId', requireAuth, async (req,res)=>{
  const body=z.object({title:z.string().min(1).max(120)}).safeParse(req.body);
  if(!body.success)return res.status(400).json({message:'Column title is required.'});
  const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const c=footer.columns.find(x=>x.id===req.params.columnId);
  if(!c)return res.status(404).json({message:'Column not found.'}); c.title=body.data.title; db.content.site.footer=footer; db.footer=footer; await writeDb(db); res.json(c);
});
app.delete('/api/footer/columns/:columnId',requireAuth,async(req,res)=>{
  const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const n=footer.columns.filter(x=>x.id!==req.params.columnId);
  if(n.length===footer.columns.length)return res.status(404).json({message:'Column not found.'}); footer.columns=n; db.content.site.footer=footer; db.footer=footer; await writeDb(db); res.status(204).end();
});
app.post('/api/footer/columns/:columnId/links',requireAuth,async(req,res)=>{
  const body=z.object({label:z.string().min(1).max(120),url:safeUrl(1000),target:z.enum(['_self','_blank']).default('_self')}).safeParse(req.body);
  if(!body.success)return res.status(400).json({message:'Invalid footer link.'});
  const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const c=footer.columns.find(x=>x.id===req.params.columnId);
  if(!c)return res.status(404).json({message:'Column not found.'}); const link={id:id(),...body.data}; c.links.push(link); db.content.site.footer=footer; db.footer=footer; await writeDb(db); res.status(201).json(link);
});
app.put('/api/footer/columns/:columnId/links/:linkId',requireAuth,async(req,res)=>{
  const body=z.object({label:z.string().min(1).max(120),url:safeUrl(1000),target:z.enum(['_self','_blank'])}).safeParse(req.body);
  if(!body.success)return res.status(400).json({message:'Invalid footer link.'});
  const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const c=footer.columns.find(x=>x.id===req.params.columnId); const l=c?.links.find(x=>x.id===req.params.linkId);
  if(!l)return res.status(404).json({message:'Footer link not found.'}); Object.assign(l,body.data); db.content.site.footer=footer; db.footer=footer; await writeDb(db); res.json(l);
});
app.delete('/api/footer/columns/:columnId/links/:linkId',requireAuth,async(req,res)=>{
  const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const c=footer.columns.find(x=>x.id===req.params.columnId); if(!c)return res.status(404).json({message:'Column not found.'});
  const n=c.links.filter(x=>x.id!==req.params.linkId); if(n.length===c.links.length)return res.status(404).json({message:'Footer link not found.'}); c.links=n; db.content.site.footer=footer; db.footer=footer; await writeDb(db); res.status(204).end();
});
app.post('/api/footer/socials',requireAuth,async(req,res)=>{
  const body=z.object({type:z.string().min(1).max(40),label:z.string().min(1).max(120),url:safeUrl(1000)}).safeParse(req.body);
  if(!body.success)return res.status(400).json({message:'Invalid social link.'}); const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const social={id:id(),...body.data}; footer.socials.push(social); db.content.site.footer=footer; db.footer=footer; await writeDb(db); res.status(201).json(social);
});
app.put('/api/footer/socials/:id',requireAuth,async(req,res)=>{
  const body=z.object({type:z.string().min(1).max(40),label:z.string().min(1).max(120),url:safeUrl(1000)}).safeParse(req.body);
  if(!body.success)return res.status(400).json({message:'Invalid social link.'}); const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const s=footer.socials.find(x=>x.id===req.params.id); if(!s)return res.status(404).json({message:'Social link not found.'}); Object.assign(s,body.data); db.content.site.footer=footer; db.footer=footer; await writeDb(db); res.json(s);
});
app.delete('/api/footer/socials/:id',requireAuth,async(req,res)=>{
  const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const n=footer.socials.filter(x=>x.id!==req.params.id); if(n.length===footer.socials.length)return res.status(404).json({message:'Social link not found.'}); footer.socials=n; db.content.site.footer=footer; db.footer=footer; await writeDb(db); res.status(204).end();
});
app.post('/api/footer/legal-links',requireAuth,async(req,res)=>{
  const body=z.object({label:z.string().min(1).max(120),url:safeUrl(1000),target:z.enum(['_self','_blank']).default('_self')}).safeParse(req.body);
  if(!body.success)return res.status(400).json({message:'Invalid legal link.'}); const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const l={id:id(),...body.data}; footer.bottom.legalLinks.push(l); db.content.site.footer=footer; db.footer=footer; await writeDb(db); res.status(201).json(l);
});
app.put('/api/footer/legal-links/:id',requireAuth,async(req,res)=>{
  const body=z.object({label:z.string().min(1).max(120),url:safeUrl(1000),target:z.enum(['_self','_blank'])}).safeParse(req.body);
  if(!body.success)return res.status(400).json({message:'Invalid legal link.'}); const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const l=footer.bottom.legalLinks.find(x=>x.id===req.params.id); if(!l)return res.status(404).json({message:'Legal link not found.'}); Object.assign(l,body.data); db.content.site.footer=footer; db.footer=footer; await writeDb(db); res.json(l);
});
app.delete('/api/footer/legal-links/:id',requireAuth,async(req,res)=>{
  const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const n=footer.bottom.legalLinks.filter(x=>x.id!==req.params.id); if(n.length===footer.bottom.legalLinks.length)return res.status(404).json({message:'Legal link not found.'}); footer.bottom.legalLinks=n; db.content.site.footer=footer; db.footer=footer; await writeDb(db); res.status(204).end();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(png|jpeg|webp)$/.test(file.mimetype))
});

app.get('/uploads/:name', async (req, res) => {
  const name = path.basename(req.params.name);
  if (!name) return res.status(404).end();
  try { return res.sendFile(path.join(uploadDir, name)); } catch { return res.status(404).end(); }
});

app.post('/api/footer/qr', requireAuth, upload.single('qr'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Upload a PNG, JPEG, or WebP image under 2 MB.' });
  const signatures = { 'image/png':[0x89,0x50,0x4e,0x47], 'image/jpeg':[0xff,0xd8,0xff], 'image/webp':[0x52,0x49,0x46,0x46] };
  const signature = signatures[req.file.mimetype];
  if (!signature || !signature.every((byte,index)=>req.file.buffer[index]===byte)) return res.status(400).json({message:'The uploaded file does not match its image type.'});
  const ext = {'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp'}[req.file.mimetype];
  const finalName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const db = await readDb();
  const footer = normalizeFooter(db.content.site.footer);
  const oldImage = footer.qrImage;
  await fs.writeFile(path.join(uploadDir, finalName), req.file.buffer);
  footer.qrImage = `/uploads/${finalName}`;
  db.content.site.footer = footer; db.footer = footer;
  await writeDb(db);
  if (oldImage?.startsWith('/uploads/')) await fs.unlink(path.join(uploadDir,path.basename(oldImage))).catch(()=>{});
  res.status(201).json({qrImage:footer.qrImage});
});

app.delete('/api/footer/qr', requireAuth, async (_req,res) => {
  const db=await readDb(); const footer=normalizeFooter(db.content.site.footer); const oldImage=footer.qrImage;
  footer.qrImage=''; db.content.site.footer=footer; db.footer=footer; await writeDb(db);
  if(oldImage?.startsWith('/uploads/')) await fs.unlink(path.join(uploadDir,path.basename(oldImage))).catch(()=>{});
  res.status(204).end();
});

/* Lead persistence helpers */
function normalizedMobile(value) {
  return String(value || '').replace(/\D/g, '').slice(-10);
}

async function savePublicLead(data) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const db = await readDb();
      db.leads ||= [];
      const mobile = normalizedMobile(data.mobile);
      const existing = db.leads.find(x => normalizedMobile(x.mobile) === mobile);

      if (existing) {
        existing.fullName = data.fullName;
        existing.mobile = mobile;
        existing.email = data.email;
        existing.experience = data.experience;
        existing.source = existing.source && existing.source !== data.source
          ? `${existing.source}, ${data.source}`
          : data.source;
        existing.status = 'New';
        existing.updatedAt = new Date().toISOString();
        await writeDb(db);
        return existing;
      }

      const lead = {
        id: id(),
        fullName: data.fullName,
        mobile,
        email: data.email,
        experience: data.experience,
        source: data.source,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      db.leads.unshift(lead);
      await writeDb(db);
      return lead;
    } catch (error) {
      lastError = error;
      if (error?.code !== 'WRITE_CONFLICT' || attempt === 2) break;
      await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
  throw lastError || new Error('Unable to save lead.');
}

async function saveAdminLead(data) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const db = await readDb();
      db.leads ||= [];
      const mobile = normalizedMobile(data.mobile);
      const existing = db.leads.find(x => normalizedMobile(x.mobile) === mobile);

      if (existing) {
        Object.assign(existing, {
          fullName: data.fullName,
          mobile,
          email: data.email,
          experience: data.experience,
          source: data.source,
          status: data.status,
          updatedAt: new Date().toISOString()
        });
        await writeDb(db);
        return existing;
      }

      const lead = {
        id: id(),
        ...data,
        mobile,
        createdAt: new Date().toISOString()
      };
      db.leads.unshift(lead);
      await writeDb(db);
      return lead;
    } catch (error) {
      lastError = error;
      if (error?.code !== 'WRITE_CONFLICT' || attempt === 2) break;
      await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
  throw lastError || new Error('Unable to save lead.');
}

/* Leads CRUD */
app.get('/api/leads', requireAuth, async (_req, res) => {
  const db = await readDb();
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.json(Array.isArray(db.leads) ? db.leads : []);
});

app.get('/api/leads/export.csv', requireAuth, async (_req, res) => {
  const db = await readDb();
  const leads = Array.isArray(db.leads) ? db.leads : [];
  const columns = ['id', 'fullName', 'mobile', 'email', 'experience', 'source', 'status', 'createdAt'];
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    columns.map(esc).join(','),
    ...leads.map(l => columns.map(c => esc(l[c])).join(','))
  ].join('\r\n');

  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="alpha-q7-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  });
  res.send('\ufeff' + csv);
});

app.post('/api/leads/admin', requireAuth, async (req, res) => {
  const parsed = z.object({
    fullName: z.string().trim().min(2).max(120),
    mobile: z.string().trim().regex(/^(?:\+?91[\s-]?)?\d{10}$/, 'Enter a valid 10-digit mobile number.'),
    email: z.string().trim().email().or(z.literal('')),
    experience: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    source: z.string().trim().min(1).max(120).default('Admin'),
    status: z.enum(['New', 'Contacted', 'Qualified', 'Closed']).default('New')
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Please provide a valid name, 10-digit mobile number, experience level and optional email.'
    });
  }

  try {
    const lead = await saveAdminLead(parsed.data);
    res.status(201).json(lead);
  } catch (error) {
    console.error('Admin lead save failed:', error);
    const status = error?.code === 'STORAGE_NOT_CONFIGURED' ? 503 : 500;
    res.status(status).json({ message: error.message || 'Unable to save lead.' });
  }
});

app.post('/api/leads', async (req, res) => {
  if (!allowLeadSubmission(req)) {
    return res.status(429).json({ message: 'Too many submissions. Please try again later.' });
  }

  const parsed = publicLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Please provide a valid name, 10-digit mobile number and optional email address.'
    });
  }

  try {
    const lead = await savePublicLead(parsed.data);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.status(200).json(lead);
  } catch (error) {
    console.error('Public lead save failed:', error);
    const status = error?.code === 'STORAGE_NOT_CONFIGURED' ? 503 : 500;
    res.status(status).json({ message: error.message || 'Unable to save your details right now.' });
  }
});

app.put('/api/leads/:id',requireAuth,async(req,res)=>{
  const body=z.object({
    fullName:z.string().trim().min(2).max(120),
    mobile:z.string().trim().min(7).max(30),
    email:z.string().trim().email().or(z.literal('')),
    experience:z.string().trim().max(120),
    source:z.string().trim().max(120),
    status:z.enum(['New','Contacted','Qualified','Closed'])
  }).safeParse(req.body);
  if(!body.success)return res.status(400).json({message:'Invalid lead update.'});
  const db=await readDb();
  const leads=db.leads||[];
  const i=leads.findIndex(x=>x.id===req.params.id);
  if(i<0)return res.status(404).json({message:'Lead not found.'});
  const mobile=normalizedMobile(body.data.mobile);
  if(!/^\d{10}$/.test(mobile))return res.status(400).json({message:'Please enter a valid 10-digit mobile number.'});
  if(leads.some((x,index)=>index!==i && normalizedMobile(x.mobile)===mobile))return res.status(409).json({message:'This mobile number is already registered.'});
  leads[i]={...leads[i],...body.data,mobile};
  await writeDb(db);
  res.json(leads[i]);
});
app.delete('/api/leads/:id',requireAuth,async(req,res)=>{const db=await readDb();const n=(db.leads||[]).filter(x=>x.id!==req.params.id);if(n.length===(db.leads||[]).length)return res.status(404).json({message:'Lead not found.'});db.leads=n;await writeDb(db);res.status(204).end();});
app.delete('/api/leads',requireAuth,async(_req,res)=>{const db=await readDb();db.leads=[];await writeDb(db);res.status(204).end();});

app.get('/api/audit-logs', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Administrator permission required.' });
  const db = await readDb();
  const search = String(req.query.search || '').trim().toLowerCase();
  const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit || '50', 10) || 50));
  const logs = (db.auditLogs || []).filter(log => {
    if (!search) return true;
    return [log.adminUsername, log.role, log.action, log.entity, log.entityId, log.statusCode, ...(log.changedFields || [])].join(' ').toLowerCase().includes(search);
  }).slice(0, limit);
  res.set('Cache-Control', 'no-store');
  res.json(logs);
});

/* =========================================================
   BACKUP & RECOVERY
========================================================= */
const backupDir = path.join(__dirname, '../backups');
await fs.mkdir(backupDir, { recursive: true });

function backupPayload(db) {
  const safe = structuredClone(db || {});
  delete safe.admin;
  return {
    format: 'alpha-q7-backup',
    version: 1,
    createdAt: new Date().toISOString(),
    data: safe
  };
}

function validateBackup(value) {
  if (!value || value.format !== 'alpha-q7-backup' || value.version !== 1 || !value.data || typeof value.data !== 'object') {
    return { success: false, error: 'Invalid Alpha Q7 backup file.' };
  }
  const data = value.data;
  if (!data.content || !Array.isArray(data.leads) || !Array.isArray(data.auditLogs || [])) {
    return { success: false, error: 'Backup is missing required data sections.' };
  }
  if (!isSafeContentValue(data.content)) return { success: false, error: 'Backup content exceeds supported limits.' };
  return { success: true, data };
}

app.get('/api/backups', requireAuth, async (_req, res) => {
  const files = await fs.readdir(backupDir, { withFileTypes: true });
  const backups = [];
  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith('.json')) continue;
    try {
      const stat = await fs.stat(path.join(backupDir, file.name));
      backups.push({ name: file.name, size: stat.size, createdAt: stat.mtime.toISOString() });
    } catch {}
  }
  backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.set('Cache-Control', 'no-store');
  res.json(backups.slice(0, 20));
});

app.post('/api/backups', requireAuth, async (req, res) => {
  const db = await readDb();
  const payload = backupPayload(db);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `alpha-q7-backup-${stamp}.json`;
  await fs.writeFile(path.join(backupDir, filename), JSON.stringify(payload, null, 2), 'utf8');
  await appendAuditLog({ adminUsername: req.user.username, role: req.user.role, action: 'BACKUP_CREATE', entity: 'backup', entityId: filename, statusCode: 201, requestId: req.requestId });
  res.status(201).json({ name: filename, size: Buffer.byteLength(JSON.stringify(payload)), createdAt: payload.createdAt });
});

app.get('/api/backups/download/:name', requireAuth, async (req, res) => {
  const name = path.basename(req.params.name);
  if (!/^alpha-q7-backup-[A-Za-z0-9_-]+\.json$/.test(name)) return res.status(400).json({ message: 'Invalid backup name.' });
  const file = path.join(backupDir, name);
  try { await fs.access(file); } catch { return res.status(404).json({ message: 'Backup not found.' }); }
  res.download(file, name);
});

app.post('/api/backups/restore', requireAuth, async (req, res) => {
  const parsed = validateBackup(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error });
  const current = await readDb();
  const before = backupPayload(current);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safetyName = `alpha-q7-pre-restore-${stamp}.json`;
  await fs.writeFile(path.join(backupDir, safetyName), JSON.stringify(before, null, 2), 'utf8');
  const restored = { ...parsed.data };
  restored.revision = Number.isInteger(current.revision) ? current.revision : 0;
  restored.admin = current.admin;
  restored.auditLogs = Array.isArray(restored.auditLogs) ? restored.auditLogs.slice(0, 10000) : [];
  await writeDb(restored);
  await appendAuditLog({ adminUsername: req.user.username, role: req.user.role, action: 'BACKUP_RESTORE', entity: 'backup', entityId: 'uploaded', statusCode: 200, requestId: req.requestId });
  res.json({ ok: true, safetyBackup: safetyName });
});

app.delete('/api/backups/:name', requireAuth, async (req, res) => {
  const name = path.basename(req.params.name);
  if (!/^alpha-q7-(backup|pre-restore)-[A-Za-z0-9_-]+\.json$/.test(name)) return res.status(400).json({ message: 'Invalid backup name.' });
  try { await fs.unlink(path.join(backupDir, name)); } catch { return res.status(404).json({ message: 'Backup not found.' }); }
  await appendAuditLog({ adminUsername: req.user.username, role: req.user.role, action: 'BACKUP_DELETE', entity: 'backup', entityId: name, statusCode: 204, requestId: req.requestId });
  res.status(204).end();
});


/* =========================================================
   CUSTOM SECTIONS
========================================================= */

const customSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#000000'),
  items: z.array(z.object({
    id: z.string(),
    heading: z.string().min(1).max(500),
    content: z.string().max(5000),
    image: z.string().optional()
  })).default([])
});

app.get('/api/sections', requireAuth, async (_req, res) => {
  const db = await readDb();
  res.json(db.customSections || []);
});

app.post('/api/sections', requireAuth, async (req, res) => {
  const parsed = customSectionSchema.safeParse({ ...req.body, id: id() });
  if (!parsed.success) return res.status(400).json({ message: 'Invalid section data.', issues: parsed.error.issues });
  const db = await readDb();
  db.customSections ||= [];
  db.customSections.push(parsed.data);
  await writeDb(db);
  res.status(201).json(parsed.data);
});

app.put('/api/sections/:id', requireAuth, async (req, res) => {
  const parsed = customSectionSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) return res.status(400).json({ message: 'Invalid section data.', issues: parsed.error.issues });
  const db = await readDb();
  db.customSections ||= [];
  const index = db.customSections.findIndex(x => x.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Section not found.' });
  db.customSections[index] = parsed.data;
  await writeDb(db);
  res.json(parsed.data);
});

app.delete('/api/sections/:id', requireAuth, async (req, res) => {
  const db = await readDb();
  db.customSections ||= [];
  const next = db.customSections.filter(x => x.id !== req.params.id);
  if (next.length === db.customSections.length) return res.status(404).json({ message: 'Section not found.' });
  db.customSections = next;
  await writeDb(db);
  res.status(204).end();
});

app.get('/api/sections/public', async (_req, res) => {
  const db = await readDb();
  res.set('Cache-Control', 'no-store');
  res.json(db.customSections || []);
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found.', requestId: req.requestId });
});

app.use((error, req, res, _next) => {
  const requestId = req.requestId || crypto.randomUUID();
  if (error?.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON request body.', requestId });
  if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Image files must be under 2 MB.', requestId });
  if (error?.code === 'STORAGE_NOT_CONFIGURED') return res.status(503).json({ message: 'File storage is not configured.', requestId });
  if (error?.code === 'WRITE_CONFLICT') return res.status(409).json({ message: 'This data changed in another request. Reload and try again.', requestId });
  if (error instanceof multer.MulterError) return res.status(400).json({ message: 'Invalid image upload.', requestId });
  console.error(`[${requestId}]`, error);
  res.status(Number.isInteger(error?.statusCode) ? error.statusCode : 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Unexpected server error. Please try again.' : (error?.message || 'Unexpected server error.'),
    requestId
  });
});

process.on('unhandledRejection', error => console.error('Unhandled promise rejection:', error));
process.on('uncaughtException', error => console.error('Uncaught exception:', error));
app.listen(port, () => console.log(`Alpha Q7 server running on http://localhost:${port}`));

export default app;
