-- LOCAL REFERENCE ONLY. SQLite, no production provisioning or Auth provider.
PRAGMA foreign_keys = ON;
CREATE TABLE accounts (
 id TEXT PRIMARY KEY, verified INTEGER NOT NULL CHECK(verified IN (0,1)),
 disabled INTEGER NOT NULL DEFAULT 0 CHECK(disabled IN (0,1))
);
CREATE TABLE students (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
 eligibility_key TEXT NOT NULL UNIQUE
);
-- Keep a minimal eligibility tombstone after student deletion, subject to approved retention.
CREATE TABLE trials (
 eligibility_key TEXT NOT NULL, product TEXT NOT NULL CHECK(product='decola-monthly-v1'),
 student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
 starts_at INTEGER NOT NULL CHECK(starts_at>=0),
 ends_at INTEGER NOT NULL CHECK(ends_at=starts_at+604800),
 canceled_at INTEGER CHECK(canceled_at IS NULL OR canceled_at>=starts_at),
 PRIMARY KEY(eligibility_key,product), UNIQUE(student_id,product)
);
CREATE TABLE subscriptions (
 id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id),
 provider_ref TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL CHECK(status IN ('active','cancel_at_period_end','past_due','revoked')),
 amount_cents INTEGER NOT NULL CHECK(amount_cents=3990), currency TEXT NOT NULL CHECK(currency='BRL'),
 starts_at INTEGER NOT NULL CHECK(starts_at>=0), ends_at INTEGER NOT NULL CHECK(ends_at>starts_at)
);
CREATE TABLE lesson_progress (
 student_id TEXT NOT NULL REFERENCES students(id), question_id TEXT NOT NULL,
 content_version TEXT NOT NULL, choice INTEGER, attempts INTEGER NOT NULL CHECK(attempts IN (1,2)),
 done INTEGER NOT NULL CHECK(done IN (0,1)), source TEXT NOT NULL CHECK(source='local-import'),
 PRIMARY KEY(student_id,question_id,content_version)
);
CREATE TABLE imports (
 student_id TEXT NOT NULL REFERENCES students(id), request_id TEXT NOT NULL,
 digest TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(student_id,request_id)
);
CREATE TABLE support_tickets (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
 channel TEXT NOT NULL CHECK(channel IN ('web','whatsapp')),
 event_id TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('question','problem','complaint','suggestion')),
 message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 1200),
 status TEXT NOT NULL CHECK(status IN ('new','awaiting_staff')), created_at INTEGER NOT NULL,
 UNIQUE(channel,event_id)
);
