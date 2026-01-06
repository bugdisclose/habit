-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  keys TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- User notification and calendar settings
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  calendar_token TEXT,
  push_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_time TEXT DEFAULT '09:00',
  evening_nudge INTEGER NOT NULL DEFAULT 1,
  evening_nudge_time TEXT DEFAULT '20:00',
  buddy_alerts INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_token ON user_settings(calendar_token);

