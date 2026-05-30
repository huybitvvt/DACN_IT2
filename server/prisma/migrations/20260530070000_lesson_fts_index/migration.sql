-- Chỉ mục GIN phục vụ full-text search cho RAG (trợ lý AI).
-- Dùng config 'simple' để không phụ thuộc ngôn ngữ (tiếng Việt + code).
CREATE INDEX IF NOT EXISTS lesson_fts_idx
  ON "Lesson"
  USING GIN (to_tsvector('simple', title || ' ' || "contentMarkdown"));
