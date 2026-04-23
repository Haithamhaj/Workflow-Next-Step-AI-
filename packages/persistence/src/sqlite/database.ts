/**
 * Pass 2 Phase 1 — SQLite connection and migration runner.
 *
 * openDatabase ensures the parent directory exists, opens a better-sqlite3
 * handle in WAL mode, and applies any pending MIGRATIONS rows inside a
 * single transaction per migration. The `_migrations` table tracks the
 * versions already applied so subsequent opens are idempotent.
 */

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database, { type Database as DB } from "better-sqlite3";
import { MIGRATIONS } from "./schema.js";

export type SqliteDatabase = DB;

export function openDatabase(dbPath: string): SqliteDatabase {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  return db;
}

export function closeDatabase(db: SqliteDatabase): void {
  db.close();
}

function runMigrations(db: SqliteDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      appliedAt TEXT NOT NULL
    );
  `);

  const appliedRows = db
    .prepare<[], { version: number }>("SELECT version FROM _migrations")
    .all();
  const applied = new Set(appliedRows.map((r) => r.version));

  const recordStmt = db.prepare(
    "INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)",
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;
    const apply = db.transaction(() => {
      db.exec(migration.up);
      recordStmt.run(migration.version, new Date().toISOString());
    });
    apply();
  }
}
