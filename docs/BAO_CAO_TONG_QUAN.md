# Báo cáo tổng quan đồ án: Website hỗ trợ học lập trình

> Tài liệu này tóm tắt toàn bộ hệ thống để phục vụ báo cáo và bảo vệ đồ án. Chi tiết kỹ thuật xem trong `.kiro/specs/learn-programming-platform/` (requirements, design, tasks).

## 1. Giới thiệu

**Tên đề tài:** Website hỗ trợ học lập trình (SQL, C, C++, Python).

**Vấn đề giải quyết:** Người mới học lập trình thường gặp các khó khăn: cài đặt môi trường phức tạp (nhất là C/C++), học lý thuyết suông không thực hành được, gặp lỗi không biết sửa, thiếu phản hồi tức thì và mất động lực. Website giải quyết bằng:

1. **Học đi đôi với hành:** chạy code ngay trên trình duyệt, không cần cài đặt.
2. **Phản hồi tức thì:** bài tập chấm tự động bằng test case, quiz có kết quả ngay.
3. **Trợ lý AI có giới hạn phạm vi:** giải đáp và giải thích lỗi bằng tiếng Việt, chỉ trong phạm vi nội dung học.
4. **Tạo động lực:** theo dõi tiến độ, lộ trình học, huy hiệu và chuỗi ngày học (streak).

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
|-----------|-----------|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, React Router, CodeMirror 6 |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL 18 |
| Chạy Python/SQL (thử) | Pyodide & sql.js (WebAssembly, chạy ngay trên trình duyệt) |
| Chạy/chấm C, C++ | Wandbox API (biên dịch online miễn phí, không cần khoá) |
| Trợ lý AI | Groq API (LLM) + RAG bằng PostgreSQL full-text search |
| Xác thực | JWT trong cookie HttpOnly, mật khẩu băm argon2id |
| Kiểm thử | Vitest, Supertest |

## 3. Kiến trúc hệ thống

Hệ thống gồm 3 phần tách biệt:

- **Client (SPA React):** giao diện người học và quản trị; chạy Python/SQL phía client.
- **Server (Express API):** xác thực, nội dung, chấm bài, quiz, tiến độ, gamification, proxy AI, quản trị. Tổ chức theo tầng route → controller → service → repository (Prisma).
- **Dịch vụ ngoài:** Wandbox (chạy C/C++), Groq (LLM). Khoá bí mật chỉ nằm ở server.

Sơ đồ kiến trúc, ERD (14 bảng) và các sơ đồ tuần tự có trong `design.md`.

## 4. Các chức năng chính

### Người học
- Đăng ký / đăng nhập (JWT, mật khẩu băm).
- Duyệt 4 khoá học, đọc bài học (Markdown + tô màu cú pháp), tìm kiếm.
- Chạy thử code ngay trên web (Python/SQL phía client; C/C++ qua server).
- Làm bài tập, chấm tự động bằng test case (gồm test case ẩn).
- Làm quiz trắc nghiệm, chấm điểm ngay, hiện đáp án đúng cho câu sai.
- Theo dõi tiến độ theo khoá (%), lộ trình học, huy hiệu, streak.
- Hỏi trợ lý AI; nhờ AI giải thích lỗi code.

### Quản trị viên
- CRUD khoá học, bài học, bài tập (kèm test case ẩn), quiz (câu hỏi/đáp án).
- Xem danh sách người dùng.
- Mọi thao tác được bảo vệ bằng quyền ADMIN.

## 5. Điểm kỹ thuật nổi bật (để trình bày khi bảo vệ)

1. **Chạy code đa tầng:** Python/SQL chạy bằng WebAssembly ngay trên trình duyệt (miễn phí, an toàn tuyệt đối), C/C++ qua dịch vụ biên dịch ngoài. Việc **chấm bài luôn chạy ở server** để giữ kín test case ẩn và đảm bảo khách quan.
2. **Trợ lý AI có guardrail:** KHÔNG huấn luyện mô hình. Dùng Groq + **RAG** (truy xuất bài học liên quan bằng PostgreSQL full-text search) + **system prompt** nghiêm ngặt để giới hạn phạm vi. Có lớp chặn phụ phía backend giảm chi phí gọi API.
3. **Thiết kế theo đặc tả (spec-driven):** yêu cầu viết theo chuẩn EARS, thiết kế có 10 "correctness properties" (bất biến hệ thống) gắn với test.
4. **An toàn:** băm argon2id, cookie HttpOnly, Helmet, sanitize Markdown chống XSS, Prisma chống SQL Injection, rate limit, bí mật trong biến môi trường.

## 6. Kiểm thử

- **45 unit/integration test** (Vitest + Supertest), tất cả pass.
- Phủ các bất biến quan trọng: bảo mật mật khẩu, kín test ẩn (Property 2), tính nhất quán chấm bài (Property 3), phân quyền admin (Property 4), tính % tiến độ (Property 5), quy tắc streak (Property 7), guardrail AI (Property 8).
- Đã kiểm thử trực tiếp (live) toàn bộ luồng với database thật, Wandbox thật và Groq thật.

## 7. Hướng dẫn chạy

Xem `README.md` ở thư mục gốc: cài đặt PostgreSQL, `npm install`, cấu hình `.env`, chạy migration + seed, rồi `npm run dev:server` và `npm run dev:client`.

Tài khoản admin mẫu (sau khi seed): `admin@lpp.local` / `admin12345`.

## 8. Hướng phát triển tiếp theo

- Streaming câu trả lời AI theo thời gian thực.
- Thay full-text search bằng vector embeddings (pgvector) để RAG chính xác hơn.
- Thêm diễn đàn hỏi đáp, bình luận dưới bài học.
- Chế độ tối/sáng, đa ngôn ngữ giao diện.
- Bổ sung E2E test (Playwright) cho các luồng chính.
