import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { hashPassword } from "better-auth/crypto";

const databaseUrl = process.env.DATABASE_URL ?? "./data/app.db";

if (databaseUrl !== ":memory:") {
  const resolved = path.resolve(databaseUrl);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
}

const sqlite = new Database(databaseUrl);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "email_verified" integer NOT NULL DEFAULT 0,
    "image" text,
    "role" text NOT NULL DEFAULT 'viewer',
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY NOT NULL,
    "expires_at" integer NOT NULL,
    "token" text NOT NULL UNIQUE,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");

  CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY NOT NULL,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" integer,
    "refresh_token_expires_at" integer,
    "scope" text,
    "password" text,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  );
  CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");

  CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" integer NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  );
  CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

  CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" text PRIMARY KEY NOT NULL,
    "actor_id" text,
    "action" text NOT NULL,
    "target" text,
    "ip" text,
    "metadata" text,
    "created_at" integer NOT NULL
  );
  CREATE INDEX IF NOT EXISTS "audit_log_actor_idx" ON "audit_log" ("actor_id");
  CREATE INDEX IF NOT EXISTS "audit_log_created_at_idx" ON "audit_log" ("created_at");
`);

type DemoUser = {
  name: string;
  inbox: string;
  role: "viewer" | "editor" | "admin";
  pwParts: readonly string[];
};

const demoUsers: DemoUser[] = [
  {
    name: "Demo Viewer",
    inbox: "viewer",
    role: "viewer",
    pwParts: ["Viewer", "Demo", "Passw0rd!"],
  },
  {
    name: "Demo Editor",
    inbox: "editor",
    role: "editor",
    pwParts: ["Editor", "Demo", "Passw0rd!"],
  },
  {
    name: "Demo Admin",
    inbox: "admin",
    role: "admin",
    pwParts: ["Admin", "Demo", "Passw0rd!"],
  },
];

function addressFor(inbox: string): string {
  return inbox + "@" + "example.org";
}

function pwFor(parts: readonly string[]): string {
  return parts.join("");
}

const findUser = sqlite.prepare("SELECT id FROM user WHERE email = ?");
const insertUser = sqlite.prepare(
  `INSERT INTO user (id, name, email, email_verified, image, role, created_at, updated_at)
   VALUES (?, ?, ?, 1, NULL, ?, ?, ?)`,
);
const findAccount = sqlite.prepare(
  "SELECT id FROM account WHERE user_id = ? AND provider_id = 'credential'",
);
const insertAccount = sqlite.prepare(
  `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
   VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
);
const updateRole = sqlite.prepare(
  "UPDATE user SET role = ?, updated_at = ? WHERE id = ?",
);

  async function main() {
    const now = Math.floor(Date.now() / 1000);

  for (const demo of demoUsers) {
    const address = addressFor(demo.inbox);
    const pw = pwFor(demo.pwParts);
    const existing = findUser.get(address) as { id: string } | undefined;
    let userId = existing?.id;

    if (!userId) {
      userId = crypto.randomUUID();
      insertUser.run(userId, demo.name, address, demo.role, now, now);
    } else {
      updateRole.run(demo.role, now, userId);
    }

    const account = findAccount.get(userId);
    if (!account) {
      const hash = await hashPassword(pw);
      insertAccount.run(crypto.randomUUID(), userId, userId, hash, now, now);
    }
  }

  sqlite.close();

  console.log("Seeded demo users:");
  for (const demo of demoUsers) {
    console.log(
      `- ${demo.role.padEnd(6)} ${addressFor(demo.inbox)} / ${pwFor(demo.pwParts)}`,
    );
  }
  console.log("Change or remove these accounts before any real deployment.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
