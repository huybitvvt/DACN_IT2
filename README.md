# Learn Programming Platform — Website hỗ trợ học lập trình

Nền tảng học lập trình tương tác cho **SQL, C, C++, Python**: học và chấm code, AI tutor local có RAG, thi đua có thưởng, trung tâm thông báo, hồ sơ lỗi Code DNA và vòng can thiệp 48 giờ dành cho học viên có nguy cơ bỏ học. Có trang quản trị theo dõi và đo kết quả can thiệp.

> Đồ án chuyên ngành. Xem kiến trúc khác biệt tại `docs/KIEN_TRUC_GIU_CHAN_HOC_VIEN.md` và kế hoạch bảo vệ tại `docs/KE_HOACH_PHAT_TRIEN_BAO_VE.md`.

## Công nghệ

- **Frontend:** React + Vite + TypeScript + TailwindCSS + CodeMirror 6
- **Backend:** Node.js + Express + TypeScript + Prisma
- **Database:** PostgreSQL
- **Chạy code:** Pyodide (Python) & sql.js (SQL) phía client; Judge0 CE local cho C/C++ và chấm bài server-side
- **AI:** Llama local qua OpenAI-compatible API + RAG bằng PostgreSQL full-text search / embedding offline

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
- **Docker Desktop** nếu muốn chạy Judge0 CE local để chấm C/C++/Python server-side.
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

# Trợ lý AI local. Ví dụ llama.cpp hoặc llama-cpp-python server chạy ở cổng 8080.
LOCAL_LLM_BASE_URL=http://localhost:8080/v1
LOCAL_LLM_MODEL=local-llama

# Judge0 CE local để chạy/chấm C/C++/Python khi nộp bài
JUDGE0_URL=http://localhost:2358
```

> Python/SQL vẫn có thể chạy thử phía trình duyệt. Để demo đầy đủ nộp bài C/C++ và trợ lý AI, hãy bật Judge0 CE local và Llama server local trước khi chạy backend.

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

### Chạy toàn bộ luồng demo bằng một lệnh

Sau khi đã cấu hình `.env`, PostgreSQL và model GGUF:

```bash
npm run demo:up
```

Lệnh này bật Judge0 + Llama, áp dụng migration, kiểm tra seed, chạy backend/frontend và tạo Cloudflare Quick Tunnel cho webhook SePay. URL webhook được in ra và sao chép vào clipboard. Kiểm tra nhanh toàn bộ hạ tầng và API trọng yếu:

```bash
npm run demo:smoke
```

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
| `npm run local:services` | Bật Judge0 local bằng Docker |
| `npm run local:services:llama` | Bật Judge0 + Llama local bằng Docker |
| `npm run demo:up` | Chuẩn bị và chạy toàn bộ môi trường demo |
| `npm run demo:status` | Xem trạng thái các dịch vụ demo |
| `npm run demo:smoke` | Kiểm tra hạ tầng và API nghiệp vụ sau đăng nhập |

## Trải nghiệm thử

1. Đăng ký một tài khoản học viên, hoặc đăng nhập admin ở trên.
2. Vào một khoá (vd Python) → đọc bài → bấm **▶ Chạy** ở ô ví dụ.
3. Mở một bài tập → viết code → **Nộp bài** để được chấm tự động.
4. Làm **Quiz** sau bài học.
5. Bấm nút 🤖 góc dưới phải để hỏi **trợ lý AI**.
6. Xem **Giữ nhịp** để thấy lý do chấm điểm và gói cứu nhịp 48 giờ.
7. Xem **Code DNA** để thấy nhóm lỗi lập trình và khuyến nghị luyện tập.
8. Mở chuông **Thông báo** để xem thanh toán, phần thưởng, mùa thi, huy hiệu và nhắc giữ nhịp.
9. Vào **Quản trị → Can thiệp sớm** để giao nhiệm vụ và theo dõi kết quả phục hồi.

## Kiểm thử

```bash
npm run test
npm run demo:smoke
```

Bộ test hiện có **80 test** frontend/backend và **6 E2E test** trên Edge desktop/mobile. Các kiểm tra phủ bảo mật mật khẩu, kín test case ẩn, chấm bài, phân quyền admin, tiến độ, streak, guardrail AI, công thức giữ nhịp V3, công thức thi đua V2, phân loại lỗi và định dạng giao diện. Smoke test kiểm tra thêm bốn dịch vụ local và năm API nghiệp vụ.

## Bảo mật

- **Mật khẩu**: băm bằng argon2id (có salt), không lưu/log dạng thường.
- **Xác thực**: JWT trong cookie HttpOnly + SameSite=Lax; lỗi đăng nhập không tiết lộ trường nào sai.
- **Phân quyền**: middleware kiểm tra vai trò ADMIN cho mọi route `/api/admin`.
- **Header bảo mật**: Helmet (HSTS, X-Frame-Options, X-Content-Type-Options...).
- **Chống XSS**: nội dung Markdown được sanitize bằng DOMPurify trước khi render.
- **Chống SQL Injection**: Prisma ORM (truy vấn tham số hoá); RAG dùng tham số `$1/$2`.
- **Rate limit**: giới hạn tần suất cho `/run`, `/exercises/:id/submit`, `/ai/chat` và toàn bộ `/api`.
- **Bí mật**: `LOCAL_LLM_API_KEY` nếu có, `DATABASE_URL`, `JWT_SECRET` đặt trong biến môi trường, không commit `.env`.

## Khả năng tiếp cận & Responsive

- Bố cục responsive bằng TailwindCSS: header có menu thu gọn trên màn hình nhỏ.
- Liên kết "Bỏ qua tới nội dung chính" cho người dùng bàn phím/đọc màn hình.
- HTML ngữ nghĩa (`header`, `nav`, `main`, `footer`), nhãn `label`, `aria-*`, `role` phù hợp.

## Điểm phát triển để bảo vệ

Xem thêm `docs/KIEN_TRUC_GIU_CHAN_HOC_VIEN.md`, `docs/KE_HOACH_PHAT_TRIEN_BAO_VE.md` và `docs/LOCAL_SERVICES.md`. Trọng tâm khác biệt là vòng kín giữ chân học viên dựa trên dữ liệu học thật, thay vì chỉ hiển thị nội dung và phần trăm tiến độ.

## Ghi chú về dịch vụ chạy code

Backend gọi **Judge0 CE local** qua `JUDGE0_URL`. Nhờ có lớp `codeRunner`, frontend và logic chấm bài không phụ thuộc trực tiếp vào công cụ compile bên dưới.
