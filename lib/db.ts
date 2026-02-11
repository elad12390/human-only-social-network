import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'

const sqlite = new Database(process.env.TURSO_DATABASE_URL?.replace('file:', '') || 'local.db')
export const db = drizzle(sqlite)
