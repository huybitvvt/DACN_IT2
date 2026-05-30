# Learn Programming Platform — Website hỗ trợ học lập trình

Nền tảng học lập trình tương tác cho **SQL, C, C++, Python**: đọc bài học, chạy code trực tiếp trên trình duyệt, làm bài tập chấm tự động, quiz, theo dõi tiến độ, gamification và trợ lý AI giới hạn phạm vi (Groq + RAG). Có trang quản trị đầy đủ.

> Đồ án chuyên ngành. Tài liệu đặc tả chi tiết nằm trong `.kiro/specs/learn-programming-platform/` (requirements, design, tasks) và báo cáo tổng quan trong `docs/BAO_CAO_TONG_QUAN.md`.

## Công nghệ

- **Frontend:** React + Vite + TypeScript + TailwindCSS + CodeMirror 6
- **Backend:** Node.js + Express + TypeScript + Prisma
- **Database:** PostgreSQL
- **Chạy code:** Pyodide (Python) & sql.js (SQL) phía client; Wandbox cho C/C++ và chấm bài
- **AI:** Groq API (gọi từ backend) + RAG bằng PostgreSQL full-text search

## Cấu trúc dự án (monorepo dùng npm workspaces)

```
.
├── client/   # Ứng dụng React (giao diện người học & admin)
├── server/   # API Express + Prisma + seed
├── .kiro/    # Tài liệu đặc tả (spec)
├── docs/     # Báo cáo tổng quan
├── .env.example
└── package.json
```

---

## HƯỚNG DẪN CHẠY (từng bước)

### Bước 0 — Yêu cầu cài sẵn

- **Node.js >= 20** (kiểm tra: `node --version`)
- **PostgreSQL** (kiểm tra: `psql --version`). Nếu chưa có, tải tại
  https://www.postgresql.org/download/ — khi cài nhớ **mật khẩu của user `postgres`**.
- **Git**

### Bước 1 — Tải mã nguồn

```bash
git clone https://github.com/huybitvvt/DACN_IT2.git
cd DACN_IT2
```

### Bước 2 — Cài đặt thư viện

```bash
npm install
```

Lệnh này tự cài cho cả `client` và `server` (npm workspaces).

### Bước 3 — Tạo database PostgreSQL

Mở terminal và tạo database tên `learn_programming` (đổi đường dẫn `psql` theo phiên bản của bạn):

```bash
# Windows (ví dụ PostgreSQL 18)
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE learn_programming;"

# macOS / Linux
psql -U postgres -c "CREATE DATABASE learn_programming;"
```

> Hoặc tạo database bằng pgAdmin nếu bạn quen giao diện.

### Bước 4 — Tạo file cấu hình `.env`

Sao chép file mẫu rồi điền giá trị:

```bash
# Windows
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

Mở `.env` và sửa các dòng quan trọng:

```ini
# Đổi user/mật khẩu/cổng cho khớp PostgreSQL của bạn
DATABASE_URL=postgresql://postgres:MAT_KHAU_CUA_BAN@localhost:5432/learn_programming?schema=public

# Một chuỗi bí mật ngẫu nhiên, dài, khó đoán
JWT_SECRET=doi-thanh-chuoi-bi-mat-ngau-nhien

# Khoá Groq cho trợ lý AI (lấy miễn phí tại https://console.groq.com)
GROQ_API_KEY=gsk_...
```

> Phần chạy code C/C++ dùng **Wandbox** — miễn phí, **không cần khoá**.
> Nếu để trống `GROQ_API_KEY`, mọi chức năng khác vẫn chạy, chỉ trợ lý AI là không hoạt động.

### Bước 5 — Tạo bảng và nạp dữ liệu mẫu

```bash
npm run prisma:migrate --workspace server   # tạo toàn bộ bảng
npm run seed --workspace server             # nạp 4 khoá học + tài khoản admin
```

Sau khi seed, có sẵn tài khoản quản trị:

- **Email:** `admin@lpp.local`
- **Mật khẩu:** `admin12345`

### Bước 6 — Chạy ứng dụng (mở 2 terminal)

```bash
# Terminal 1 — Backend (cổng 4000)
npm run dev:server

# Terminal 2 — Frontend (cổng 5173)
npm run dev:client
```

Mở trình duyệt: **http://localhost:5173**

> Lần đầu bấm "Chạy" code Python, trình duyệt cần tải Pyodide (~vài giây) rồi sẽ nhanh ở các lần sau.

---

## Các lệnh hữu ích

| Lệnh | Mô tả |
|------|-------|
| `npm run dev:server` | Chạy backend (tự reload khi sửa code) |
| `npm run dev:client` | Chạy frontend (Vite dev server) |
| `npm run build` | Build cả server và client cho production |
| `npm run test` | Chạy toàn bộ test |
| `npm run seed --workspace server` | Nạp lại dữ liệu mẫu |
| `npm run prisma:studio --workspace server` | Mở giao diện xem/sửa database |

## Trải nghiệm thử

1. Đăng ký một tài khoản học viên, hoặc đăng nhập admin ở trên.
2. Vào một khoá (vd Python) → đọc bài → bấm **▶ Chạy** ở ô ví dụ.
3. Mở một bài tập → viết code → **Nộp bài** để được chấm tự động.
4. Làm **Quiz** sau bài học.
5. Bấm nút 🤖 góc dưới phải để hỏi **trợ lý AI**.
6. Xem **Tiến độ** (dashboard) và **Quản trị** (nếu là admin).

## Kiểm thử

```bash
npm run test --workspace server
```

Bộ test gồm 45 unit/integration test (Vitest + Supertest) phủ các bất biến quan trọng: bảo mật mật khẩu, kín test case ẩn, tính nhất quán chấm bài, phân quyền admin, tính phần trăm tiến độ, quy tắc streak, guardrail của trợ lý AI.

## Bảo mật

- **Mật khẩu**: băm bằng argon2id (có salt), không lưu/log dạng thường.
- **Xác thực**: JWT trong cookie HttpOnly + SameSite=Lax; lỗi đăng nhập không tiết lộ trường nào sai.
- **Phân quyền**: middleware kiểm tra vai trò ADMIN cho mọi route `/api/admin`.
- **Header bảo mật**: Helmet (HSTS, X-Frame-Options, X-Content-Type-Options...).
- **Chống XSS**: nội dung Markdown được sanitize bằng DOMPurify trước khi render.
- **Chống SQL Injection**: Prisma ORM (truy vấn tham số hoá); RAG dùng tham số `$1/$2`.
- **Rate limit**: giới hạn tần suất cho `/run`, `/exercises/:id/submit`, `/ai/chat` và toàn bộ `/api`.
- **Bí mật**: `GROQ_API_KEY`, `DATABASE_URL`, `JWT_SECRET` đặt trong biến môi trường, không commit `.env`.

## Khả năng tiếp cận & Responsive

- Bố cục responsive bằng TailwindCSS: header có menu thu gọn trên màn hình nhỏ.
- Liên kết "Bỏ qua tới nội dung chính" cho người dùng bàn phím/đọc màn hình.
- HTML ngữ nghĩa (`header`, `nav`, `main`, `footer`), nhãn `label`, `aria-*`, `role` phù hợp.

## Ghi chú về dịch vụ chạy code

Ban đầu dự kiến dùng Judge0 (qua RapidAPI) nhưng gói free yêu cầu thẻ tín dụng, nên đã chuyển sang **Wandbox** (mã nguồn mở, miễn phí, không cần khoá). Backend là lớp trung gian nên có thể đổi sang dịch vụ khác mà không ảnh hưởng phần còn lại.
