-- VPS-only durable orchestration metadata; never apply to live D1.
CREATE TABLE IF NOT EXISTS LocalWorkflowInstance (
 id TEXT PRIMARY KEY,
 workflow TEXT NOT NULL CHECK(workflow IN ('withdrawal','mining','loan')),
 entityId TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('RUNNING','WAITING','SLEEPING','COMPLETED','FAILED')),
 phase TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0,
 nextAt INTEGER NOT NULL,
 awaitedEvent TEXT,
 context TEXT NOT NULL DEFAULT '{}',
 leaseToken TEXT,
 leaseUntil INTEGER,
 createdAt INTEGER NOT NULL,
 updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS LocalWorkflowInstance_due_idx ON LocalWorkflowInstance(status,nextAt,leaseUntil);
CREATE TABLE IF NOT EXISTS LocalWorkflowStep (
 instanceId TEXT NOT NULL REFERENCES LocalWorkflowInstance(id),
 name TEXT NOT NULL,
 commandKey TEXT NOT NULL,
 result TEXT NOT NULL,
 completedAt INTEGER NOT NULL,
 PRIMARY KEY(instanceId,name)
);
CREATE TABLE IF NOT EXISTS LocalWorkflowEvent (
 instanceId TEXT NOT NULL REFERENCES LocalWorkflowInstance(id),
 eventType TEXT NOT NULL,
 eventKey TEXT NOT NULL,
 payload TEXT NOT NULL,
 receivedAt INTEGER NOT NULL,
 consumedAt INTEGER,
 PRIMARY KEY(instanceId,eventKey)
);
