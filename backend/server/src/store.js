import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
const dbPath = path.join(dataDir, 'db.json');
const bundledDbPath = path.resolve(__dirname, '../data/db.seed.json');
const defaultDb = { revision: 0, admin: { username: 'admin', passwordHash: '' }, content: { site: {}, courses: [], learn: [], testimonials: [], faq: [] }, leads: [], customSections: [], leadActivity: [], auditLogs: [] };
let writeQueue = Promise.resolve();
let pgPool;
const usingPostgres = () => Boolean(process.env.DATABASE_URL);
async function getPgPool() {
  if (!usingPostgres()) return null;
  if (!pgPool) {
    let pg;
    try { pg = await import('pg'); } catch { const e = new Error('PostgreSQL is configured but the pg package is not installed. Run npm install --prefix server.'); e.code = 'PG_DRIVER_MISSING'; throw e; }
    pgPool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined, max: Number(process.env.DATABASE_POOL_MAX || 10), idleTimeoutMillis: 30000 });
    pgPool.on('error', err => console.error('[postgres] pool error:', err.message));
  }
  return pgPool;
}
async function readSeedOnly() { try { return JSON.parse(await fs.readFile(bundledDbPath, 'utf8')); } catch { return structuredClone(defaultDb); } }
async function ensurePgSchema(pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, revision BIGINT NOT NULL DEFAULT 0, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const r = await pool.query('SELECT id FROM app_state WHERE id = 1');
  if (!r.rowCount) { const seed = await readSeedOnly(); await pool.query('INSERT INTO app_state (id, revision, data) VALUES (1, $1, $2::jsonb)', [Number(seed.revision || 0), JSON.stringify(seed)]); }
}
async function readLocalDb() {
  try { const db = JSON.parse(await fs.readFile(dbPath, 'utf8')); db.revision = Number.isInteger(db.revision) ? db.revision : 0; db.leadActivity ||= []; db.auditLogs ||= []; return db; }
  catch { await fs.mkdir(dataDir, { recursive: true }); const bundled = await readSeedOnly(); await fs.writeFile(dbPath, JSON.stringify(bundled, null, 2)); return bundled; }
}
export async function readDb() {
  if (!usingPostgres()) return readLocalDb();
  const pool = await getPgPool(); await ensurePgSchema(pool); const { rows } = await pool.query('SELECT data FROM app_state WHERE id = 1');
  const db = rows[0]?.data || structuredClone(defaultDb); db.revision = Number(db.revision || 0); db.leadActivity ||= []; db.auditLogs ||= []; return db;
}
export function writeDb(db) {
  const job = writeQueue.then(async () => {
    if (!usingPostgres()) {
      await fs.mkdir(dataDir, { recursive: true }); let current; try { current = JSON.parse(await fs.readFile(dbPath, 'utf8')); } catch { current = structuredClone(defaultDb); }
      const currentRevision = Number(current.revision || 0), expectedRevision = Number(db.revision || 0); if (currentRevision !== expectedRevision) { const e = new Error('The content was changed by another request. Reload and try again.'); e.code='WRITE_CONFLICT'; throw e; }
      db.revision = currentRevision + 1; const temp = `${dbPath}.tmp`; await fs.writeFile(temp, JSON.stringify(db, null, 2)); await fs.rename(temp, dbPath); return;
    }
    const pool = await getPgPool(); await ensurePgSchema(pool); const client = await pool.connect();
    try { await client.query('BEGIN'); const { rows } = await client.query('SELECT revision FROM app_state WHERE id=1 FOR UPDATE'); const currentRevision=Number(rows[0]?.revision||0), expectedRevision=Number(db.revision||0);
      if (currentRevision !== expectedRevision) { const e=new Error('The content was changed by another request. Reload and try again.'); e.code='WRITE_CONFLICT'; throw e; }
      db.revision=currentRevision+1; await client.query('UPDATE app_state SET revision=$1,data=$2::jsonb,updated_at=NOW() WHERE id=1',[db.revision,JSON.stringify(db)]); await client.query('COMMIT');
    } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }); writeQueue=job.catch(()=>{}); return job;
}
export async function appendAuditLog(entry) {
  let lastError; for (let attempt=0; attempt<3; attempt++) { try { const db=await readDb(); db.auditLogs ||= []; db.auditLogs.unshift({id:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,createdAt:new Date().toISOString(),...entry}); db.auditLogs=db.auditLogs.slice(0,10000); await writeDb(db); return; } catch(e) { lastError=e; if(e?.code!=='WRITE_CONFLICT'||attempt===2) break; await new Promise(r=>setTimeout(r,25*(attempt+1))); } } throw lastError||new Error('Unable to write audit log.');
}
export async function closeDb(){ if(pgPool){ await pgPool.end(); pgPool=undefined; } }
