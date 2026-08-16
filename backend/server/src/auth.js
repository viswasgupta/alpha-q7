import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { readDb, writeDb, appendAuditLog } from './store.js';

const COOKIE_NAME = 'alpha_q7_admin';
const JWT_SECRET = process.env.JWT_SECRET;
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 10);
const SESSION_HOURS = Math.min(24, Math.max(1, Number(process.env.ADMIN_SESSION_HOURS || 8)));
const SESSION_MS = SESSION_HOURS * 60 * 60 * 1000;

function clientKey(req) { return req.ip || req.socket.remoteAddress || 'unknown'; }
function isLoginLimited(req) {
  const now = Date.now();
  const key = clientKey(req);
  const attempts = (loginAttempts.get(key) || []).filter(time => now - time < LOGIN_WINDOW_MS);
  loginAttempts.set(key, attempts);
  return attempts.length >= LOGIN_MAX_ATTEMPTS;
}
function registerFailedLogin(req) {
  const key = clientKey(req);
  loginAttempts.set(key, [...(loginAttempts.get(key) || []), Date.now()]);
}

export async function ensureAdmin() {
  if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  const db = await readDb();  
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be configured.');
  }

  if (!db.admin?.passwordHash || db.admin.username !== username || process.env.SYNC_ADMIN_ENV === 'true') {
    db.admin = {
      username,
      passwordHash: await bcrypt.hash(password, 12)
    };
    await writeDb(db);
    console.warn(`Admin credentials synchronized for "${username}".`);
  }
}

export async function login(req, res) {
  if (isLoginLimited(req)) { appendAuditLog({ adminUsername: String(req.body?.username || 'unknown'), role: 'unknown', action: 'AUTH_RATE_LIMITED', entity: 'auth', statusCode: 429, requestId: req.requestId }).catch(() => {}); return res.status(429).json({ message: 'Too many sign-in attempts. Try again in 15 minutes.' }); }
  try {
    await ensureAdmin();
  } catch (error) {
    console.error('Admin initialization failed:', error);
    return res.status(503).json({ message: 'Admin authentication is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD and JWT_SECRET in server\.env.' });
  }
  const { username, password } = req.body || {};
  const db = await readDb();
  if (!username || !password || username !== db.admin.username) {
    registerFailedLogin(req);
    appendAuditLog({ adminUsername: String(username || 'unknown'), role: 'unknown', action: 'AUTH_LOGIN_FAILED', entity: 'auth', statusCode: 401, requestId: req.requestId }).catch(() => {});
    return res.status(401).json({ message: 'Invalid username or password.' });
  }
  const valid = await bcrypt.compare(password, db.admin.passwordHash);
  if (!valid) {
    registerFailedLogin(req);
    appendAuditLog({ adminUsername: String(username || 'unknown'), role: 'unknown', action: 'AUTH_LOGIN_FAILED', entity: 'auth', statusCode: 401, requestId: req.requestId }).catch(() => {});
    return res.status(401).json({ message: 'Invalid username or password.' });
  }
  loginAttempts.delete(clientKey(req));

  const token = jwt.sign(
    { sub: crypto.randomUUID(), username: db.admin.username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: `${SESSION_HOURS}h`, issuer: 'alpha-q7-admin' }
  );

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MS,
    path: '/'
  });

  appendAuditLog({ adminUsername: db.admin.username, role: 'admin', action: 'AUTH_LOGIN_SUCCESS', entity: 'auth', statusCode: 200, requestId: req.requestId }).catch(() => {});
  return res.json({ user: { username: db.admin.username, role: 'admin' } });
}

export function requireAuth(req, res, next) {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    return res.status(503).json({ message: 'Admin authentication is not configured. Set JWT_SECRET in server\.env.' });
  }
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET, { issuer: 'alpha-q7-admin' });
    next();
  } catch {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
}

export function logout(req, res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
  appendAuditLog({ adminUsername: req.user?.username || 'unknown', role: req.user?.role || 'unknown', action: 'AUTH_LOGOUT', entity: 'auth', statusCode: 200, requestId: req.requestId }).catch(() => {});
  res.json({ ok: true });
}
