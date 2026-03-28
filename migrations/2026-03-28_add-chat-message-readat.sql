ALTER TABLE chat_message
  ADD COLUMN readAt DATETIME NULL,
  ADD INDEX idx_readAt (readAt);
