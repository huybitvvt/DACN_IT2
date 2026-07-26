# Chạy dịch vụ local cho demo

Tài liệu này dùng khi demo hướng tự chủ hạ tầng: không dùng Groq, không dùng Wandbox.

## 0. Chạy nhanh toàn bộ demo

```bash
npm run demo:up
npm run demo:smoke
```

`demo:up` kiểm tra Docker, bật Judge0 + Llama, migrate database, chạy frontend/backend và tạo Quick Tunnel cho webhook SePay. Dán URL được sao chép vào trường URL webhook của SePay. Quick Tunnel thay đổi URL khi tiến trình tunnel được tạo lại.

`demo:smoke` không chỉ ping cổng. Script đăng nhập bằng tài khoản admin demo, kiểm tra các API thông báo, giữ nhịp, Code DNA, can thiệp sớm và xác nhận webhook SePay đi đúng lớp API-key auth.

## 1. Judge0 CE local

Backend gọi Judge0 qua:

```ini
JUDGE0_URL=http://localhost:2358
```

Cách chạy nhanh trong repo:

```bash
npm run local:services
```

Lệnh này dùng `docker/local-services/docker-compose.yml` để bật Judge0 API, worker, PostgreSQL và Redis local.

Cách chạy thủ công theo tài liệu chính thức:

1. Cài Docker Desktop.
2. Làm theo hướng dẫn self-host chính thức của Judge0 CE tại https://github.com/judge0/judge0.
3. Sau khi container chạy, kiểm tra:

```bash
curl http://localhost:2358/languages
```

4. Chạy backend và thử bài C/C++ trên web.

Ghi chú khi bảo vệ: Judge0 chạy code trong sandbox, có thể cấu hình giới hạn CPU/RAM/thời gian, phù hợp hơn dịch vụ compile ngoài cho hệ thống chấm bài.

Ghi chú riêng cho Docker Desktop trên Windows: Judge0 CE 1.13.x dùng `isolate` với cgroup v1, trong khi Docker Desktop thường chạy cgroup v2. Backend đã gửi thêm `enable_per_process_and_thread_time_limit=true` và `enable_per_process_and_thread_memory_limit=true` khi nộp code để Judge0 dùng giới hạn per-process, tránh lỗi sandbox `No such file or directory @ rb_sysopen - /box/...`.

## 2. Llama local

Backend gọi LLM qua OpenAI-compatible endpoint:

```ini
LOCAL_LLM_BASE_URL=http://localhost:8080/v1
LOCAL_LLM_API_KEY=
LOCAL_LLM_MODEL=local-llama
```

Cách chạy bằng Docker trong repo:

1. Tải một model GGUF phù hợp máy demo.
2. Đặt file vào `docker/local-services/models/`.
3. Sao chép `docker/local-services/.env.example` thành `docker/local-services/.env`.
4. Sửa `LLAMA_MODEL_FILE` cho khớp tên file GGUF.
5. Chạy:

```bash
npm run local:services:llama
```

Có thể dùng một trong hai hướng:

- `llama.cpp` server: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md
- `llama-cpp-python` server: https://llama-cpp-python.readthedocs.io/en/latest/server/

Sau khi server chạy, kiểm tra endpoint `/v1/chat/completions`, rồi mở website và hỏi trợ lý AI ở góc dưới phải.

Ghi chú khi bảo vệ: backend vẫn giữ RAG và guardrail; việc thay Groq bằng Llama local chỉ thay lớp gọi mô hình, không phá kiến trúc AI hiện có.

## 3. Database

Sau khi pull code mới:

```bash
npm run prisma:migrate --workspace server
npm run seed --workspace server
```

Nếu Prisma CLI không tự đọc `.env` ở thư mục gốc khi chạy trên Windows, có thể truyền `DATABASE_URL` trong terminal hiện tại rồi chạy lại migrate.

## 4. Demo nhanh

1. Đăng nhập hoặc đăng ký học viên.
2. Vào khoá học, hoàn thành bài học hoặc làm quiz.
3. Vào `/contests` để xem mùa thi `CodeLearn Sprint 1`.
4. Mở chi tiết mùa thi để xem ranking và phần thưởng.
5. Nếu tài khoản nằm trong top nhận thưởng, bấm **Yêu cầu nhận thưởng**.
6. Đăng nhập admin, vào `/admin/contests` để tạo/sửa mùa thi và duyệt/từ chối yêu cầu nhận thưởng.
7. Trong chi tiết mùa thi, bấm **Bắt đầu phòng thi**, làm các câu thi rồi bấm **Nộp phòng thi** để chốt điểm attempt.
8. Chạy thử code C/C++ để chứng minh Judge0 local hoạt động.
9. Hỏi AI một câu trong phạm vi bài học và một câu ngoài phạm vi để chứng minh guardrail.

## 5. Luồng thi đua đã có trong code

- Admin tạo mùa thi, cấu hình thời gian, phạm vi khoá học và mốc phần thưởng.
- Hệ thống tính ranking từ dữ liệu học thật: progress, submission pass, quiz attempt, streak, badge.
- Học viên xem rank của mình trong từng mùa thi.
- Học viên có phòng thi riêng theo mùa: start attempt, giới hạn thời gian, làm bài code/quiz, submit attempt.
- Học viên đủ điều kiện có thể gửi yêu cầu nhận thưởng.
- Admin duyệt hoặc từ chối yêu cầu tại `/admin/contests`.
- Admin cấu hình đề phòng thi ngay trong `/admin/contests` bằng cách gắn Exercise ID hoặc Quiz ID có sẵn.
- Database đã có `Contest`, `ContestReward`, `RewardClaim`, `ContestProblem`, `ContestAttempt`.

## 6. Lệnh local service

| Lệnh | Mục đích |
|------|----------|
| `npm run local:services` | Bật Judge0 local |
| `npm run local:services:llama` | Bật Judge0 + Llama local |
| `npm run local:services:status` | Xem trạng thái container |
| `npm run local:services:down` | Tắt các container local |
| `npm run demo:up` | Chạy trọn bộ môi trường và tunnel thanh toán |
| `npm run demo:status` | Kiểm tra frontend/backend/Judge0/Llama |
| `npm run demo:smoke` | Smoke test hạ tầng và API nghiệp vụ |
