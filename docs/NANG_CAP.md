# Danh sách nâng cấp (A + B + C)

## Nhóm A — Ấn tượng
- [x] 1. Dark mode (chế độ tối)
- [x] 2. Chứng chỉ hoàn thành khoá học
- [x] 3. Streaming câu trả lời AI
- [x] 4. Bảng xếp hạng (Leaderboard)

## Nhóm B — Chiều sâu kỹ thuật
- [x] 5. Vector embeddings cho AI (pgvector)
- [x] 6. Lịch sử bài nộp
- [x] 7. Editor nâng cao

## Nhóm C — Trải nghiệm
- [ ] 8. Ghi chú & đánh dấu bài học (bookmark)
- [ ] 9. Bình luận/hỏi đáp dưới bài học
- [ ] 10. Tìm kiếm nâng cao (highlight từ khoá)

---

## Ghi chú kỹ thuật về #5 (Vector embeddings)

- **Tạo embeddings:** dùng **Transformers.js** (`@xenova/transformers`) chạy model
  `paraphrase-multilingual-MiniLM-L12-v2` **ngay trong Node, offline, miễn phí** — không cần
  API key (Groq không cung cấp embeddings). Chọn model đa ngôn ngữ vì hỗ trợ tiếng Việt tốt.
- **Lưu trữ:** embedding (vector 384 chiều) lưu ở cột `Lesson.embedding` (kiểu JSON).
  Không dùng extension `pgvector` vì: (1) pgvector chưa cài sẵn trên PostgreSQL Windows và
  cần biên dịch; (2) số bài học nhỏ nên tính **cosine similarity trong Node** là đủ nhanh.
  Kiến trúc tách riêng nên có thể chuyển sang pgvector sau mà không đổi API.
- **Fallback:** nếu tạo embedding lỗi, RAG tự động quay về **full-text search** của PostgreSQL.
- **Kết quả:** semantic search tìm đúng bài kể cả khi câu hỏi không chứa từ khoá khớp chính xác
  (ví dụ "lặp lại đoạn code nhiều lần" → ra bài "Vòng lặp"), vượt trội full-text search.
