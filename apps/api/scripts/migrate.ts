#!/usr/bin/env bun
/**
 * Usage:
 *   bun scripts/migrate.ts apply              # aplica migraciones pendientes a la BD
 *   bun scripts/migrate.ts mark-applied       # marca todas como aplicadas sin correrlas (bootstrap)
 *   bun scripts/migrate.ts <nombre>           # genera diff y aplica
 *   bun scripts/migrate.ts <nombre> --dry     # solo genera el SQL, no aplica
 */
import { execSync } from "child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@libsql/client";

const [command, flag] = process.argv.slice(2);

if (!command) {
  console.error("Usage:");
  console.error("  bun scripts/migrate.ts apply              # aplica todas las migraciones existentes");
  console.error("  bun scripts/migrate.ts <nombre> [--dry]  # genera y aplica un nuevo diff");
  process.exit(1);
}

const migrationsDir = join(import.meta.dir, "../prisma/migrations");
const schemaPath = join(import.meta.dir, "../prisma/schema.prisma");

function getClient() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("DATABASE_URL o DATABASE_AUTH_TOKEN no configurados.");
    process.exit(1);
  }
  return createClient({ url, authToken });
}

// ── SUBCOMANDO: mark-applied ───────────────────────────────────────────────────
// Útil cuando la BD ya tiene las migraciones aplicadas pero la tabla _migrations
// no existía aún (bootstrap). Registra todas las migraciones sin volver a correrlas.

if (command === "mark-applied") {
  const migrationFolders = readdirSync(migrationsDir)
    .filter((entry) => !entry.endsWith(".toml"))
    .sort();

  const client = getClient();

  await client.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  for (const folder of migrationFolders) {
    await client.execute({
      sql: "INSERT OR IGNORE INTO _migrations (name, applied_at) VALUES (?, ?)",
      args: [folder, new Date().toISOString()],
    });
    console.log(`✓ ${folder} (marcada como aplicada)`);
  }

  console.log("Listo.");
  process.exit(0);
}

// ── SUBCOMANDO: apply ──────────────────────────────────────────────────────────

if (command === "apply") {
  const migrationFolders = readdirSync(migrationsDir)
    .filter((entry) => !entry.endsWith(".toml"))
    .sort();

  if (migrationFolders.length === 0) {
    console.log("No hay migraciones para aplicar.");
    process.exit(0);
  }

  const client = getClient();

  await client.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = new Set(
    (await client.execute("SELECT name FROM _migrations")).rows.map(
      (r) => r["name"] as string,
    ),
  );

  let count = 0;
  for (const folder of migrationFolders) {
    if (applied.has(folder)) {
      console.log(`· ${folder} (ya aplicada)`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, folder, "migration.sql"), "utf-8");
    try {
      await client.executeMultiple(sql);
      await client.execute({
        sql: "INSERT INTO _migrations (name, applied_at) VALUES (?, ?)",
        args: [folder, new Date().toISOString()],
      });
      console.log(`✓ ${folder}`);
      count++;
    } catch (e) {
      console.error(`✗ ${folder}`);
      console.error(e);
      process.exit(1);
    }
  }

  console.log(count > 0 ? `${count} migración(es) aplicada(s).` : "Todo al día, sin migraciones pendientes.");
  process.exit(0);
}

// ── SUBCOMANDO: <nombre> [--dry] ───────────────────────────────────────────────

const migrationName = command;
const isDry = flag === "--dry";
const fromArg = `--from-migrations ${migrationsDir}`;

let sql: string;
try {
  sql = execSync(
    `bunx prisma migrate diff ${fromArg} --to-schema ${schemaPath} --script`,
    { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
  )
    .split("\n")
    .filter((line) => !line.startsWith("Loaded Prisma config"))
    .join("\n")
    .trim();
} catch (e) {
  console.error("Error generando el diff:", e);
  process.exit(1);
}

if (!sql || sql === "-- This is an empty migration.") {
  console.log("Sin cambios en el schema. No se generó ninguna migración.");
  process.exit(0);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[-T:.Z]/g, "")
  .slice(0, 14);
const dirName = `${timestamp}_${migrationName.replace(/\s+/g, "_")}`;
const migrationDir = join(migrationsDir, dirName);
mkdirSync(migrationDir, { recursive: true });
writeFileSync(join(migrationDir, "migration.sql"), sql + "\n");
console.log(`Migración generada: prisma/migrations/${dirName}/migration.sql`);

if (isDry) {
  console.log("Modo --dry: migración no aplicada.");
  process.exit(0);
}

const client = getClient();
try {
  await client.executeMultiple(sql);
  console.log("Migración aplicada a Turso exitosamente.");
} catch (e) {
  console.error("Error aplicando la migración:", e);
  console.error(
    `Podés aplicarla manualmente:\n  turso db shell <db> < prisma/migrations/${dirName}/migration.sql`,
  );
  process.exit(1);
}
