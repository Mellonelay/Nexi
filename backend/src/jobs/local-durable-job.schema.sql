-- VPS SQLite durable-job schema; change only through an authorized migration, never a cleanup.
-- The journal shares the application SQLite file; jobs remain replayable if Valkey is lost.
CREATE TABLE IF NOT EXISTS LocalDurableJob (
 id TEXT PRIMARY KEY,
 queue TEXT NOT NULL CHECK(queue IN ('domain-events','notifications','integration-jobs')),
 logicalKey TEXT NOT NULL,
 envelope TEXT NOT NULL,
 contentHash TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','COMPLETED','FAILED')),
 attempts INTEGER NOT NULL DEFAULT 0,
 generation INTEGER NOT NULL DEFAULT 0 CHECK(generation >= 0),
 generationAttempts INTEGER NOT NULL DEFAULT 0 CHECK(generationAttempts >= 0),
 availableAt INTEGER NOT NULL,
 leaseToken TEXT,
 leaseUntil INTEGER,
 lastError TEXT,
 createdAt INTEGER NOT NULL,
 updatedAt INTEGER NOT NULL,
 completedAt INTEGER,
 UNIQUE(queue,logicalKey)
);
CREATE INDEX IF NOT EXISTS LocalDurableJob_dispatch_idx ON LocalDurableJob(state,availableAt,leaseUntil);
CREATE TABLE IF NOT EXISTS LocalDurableJobReplayHistory (
 journalId TEXT NOT NULL,
 generation INTEGER NOT NULL CHECK(generation >= 0),
 attempts INTEGER NOT NULL CHECK(attempts > 0),
 generationAttempts INTEGER NOT NULL CHECK(generationAttempts > 0),
 lastError TEXT,
 replayedAt INTEGER NOT NULL,
 PRIMARY KEY(journalId,generation),
 FOREIGN KEY(journalId) REFERENCES LocalDurableJob(id) ON DELETE RESTRICT
);
