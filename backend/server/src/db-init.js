import { readDb, closeDb } from './store.js';
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is required.'); process.exit(1); }
await readDb();
console.log('PostgreSQL schema initialized.');
await closeDb();
