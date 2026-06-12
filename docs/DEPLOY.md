# Hướng dẫn deploy online

Tài liệu này hướng dẫn đưa website lên Internet để có link demo cho hội đồng.

Kiến trúc deploy: **1 web service duy nhất** — Express vừa chạy API vừa phục vụ
giao diện React đã build (cùng domain). Cách này đơn giản nhất, không vướng lỗi
cookie/CORS giữa hai domain.

---

## Phương án khuyến nghị: Render.com (miễn phí)

Render hỗ trợ Node + PostgreSQL miễn phí, **không cần thẻ tín dụng**.

### Bước 1 — Chuẩn bị

- Code đã đẩy lên GitHub (đã xong: https://github.com/huybitvvt/DACN_IT2)
- Có khoá `GROQ_API_KEY` (lấy free tại https://console.groq.com)
- Tạo tài khoản tại https://render.com (đăng nhập bằng GitHub cho nhanh)

### Bước 2 — Tạo database PostgreSQL

1. Trên Render: **New +** → **PostgreSQL**
2. Name: `codelearn-db`, Plan: **Free** → **Create Database**
3. Đợi tạo xong, vào tab **Info**, copy **Internal Database URL** (dùng ở bước sau)

### Bước 3 — Tạo Web Service

1. **New +** → **Web Service** → chọn repo `DACN_IT2`
2. Cấu hình:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build && npm run prisma:deploy --workspace server && npm run seed --workspace server`
   - **Start Command:** `npm run start --workspace server`

   > **Vì sao gộp migrate + seed vào Build Command?** Gói Free của Render **không có Shell/SSH**
   > nên không chạy lệnh thủ công được. Vì vậy ta đưa luôn vào bước build. Script seed đã được
   > làm **idempotent** (nếu đã có dữ liệu thì tự bỏ qua), nên chạy lại ở mỗi lần deploy
   > **không xoá** tiến độ người dùng. (Muốn nạp lại từ đầu: đặt biến `SEED_FORCE=true`.)
3. Thêm **Environment Variables** (tab Environment):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | dán Internal Database URL ở Bước 2 |
| `JWT_SECRET` | một chuỗi ngẫu nhiên dài bất kỳ |
| `JWT_EXPIRES_IN` | `7d` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | email Gmail dùng gửi mã |
| `SMTP_PASS` | Gmail App Password |
| `SMTP_FROM` | `CodeLearn <email Gmail dùng gửi mã>` |
| `GROQ_API_KEY` | khoá Groq của bạn |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `ENABLE_SEMANTIC_RAG` | `false` |
| `WANDBOX_URL` | `https://wandbox.org` |
| `CLIENT_ORIGIN` | URL service (điền sau khi có, vd `https://codelearn.onrender.com`) |
| `PUBLIC_API_URL` | bỏ trống nếu API và frontend chung domain; nếu tách domain thì điền URL backend |

4. **Create Web Service**. Render sẽ build (lần đầu ~5-10 phút).

### Bước 4 — Hoàn tất

Migration và seed đã chạy tự động trong Build Command (xem Bước 3), nên sau khi deploy
xong là website đã có sẵn 4 khoá học + tài khoản admin.

> Nếu bạn dùng **gói trả phí** (có Shell), có thể bỏ migrate+seed khỏi Build Command và chạy
> thủ công trong tab **Shell**:
> ```bash
> npm run prisma:deploy --workspace server
> npm run seed --workspace server
> ```

### Bước 5 — Mở website

- Mở URL Render cấp (vd `https://codelearn.onrender.com`)
- Đăng nhập admin: `admin@lpp.local` / `admin12345`
- Cập nhật biến `CLIENT_ORIGIN` = đúng URL này rồi **Save** (service tự deploy lại)

---

## Lưu ý quan trọng

- **Gói Free của Render "ngủ" sau 15 phút không dùng** → lần truy cập đầu sau đó mất
  ~30-60 giây để khởi động lại. Bình thường với bản demo. Trước buổi bảo vệ, hãy truy cập
  trước 1-2 phút cho nó "thức dậy".
- **Trợ lý AI lần đầu tải model embedding (~120MB)** nên câu hỏi AI đầu tiên hơi lâu.
  Trên Render Free nên để `ENABLE_SEMANTIC_RAG=false` để dùng RAG full-text nhẹ hơn.
  Nếu dùng máy/server mạnh hơn, có thể đặt `ENABLE_SEMANTIC_RAG=true`.
- **Chạy code C/C++** gọi Wandbox (Internet) — Render có Internet nên chạy bình thường.
- **Bí mật**: không commit `.env`. Mọi khoá điền trực tiếp trong dashboard Render.
- **Gmail SMTP**: tài khoản gửi mã cần bật 2-Step Verification và tạo **App Password**.
  Không dùng mật khẩu đăng nhập Gmail thường cho `SMTP_PASS`.
- **Render Free có thể chặn SMTP**: nếu gửi Gmail SMTP bị timeout trên cổng `465`,
  hãy nâng Web Service lên gói trả phí hoặc chạy trên môi trường cho phép outbound SMTP.

---

## Phương án thay thế: deploy tách 2 domain (nâng cao)

Nếu muốn frontend (Vercel/Netlify) và backend (Render) ở 2 domain riêng:

1. Backend (Render): đặt thêm biến `CROSS_SITE_COOKIE=true` để cookie dùng
   `SameSite=None; Secure` (gửi được cross-site).
2. Frontend (Vercel): đặt biến `VITE_API_URL=https://backend-cua-ban.onrender.com/api`.
3. Backend: đặt `CLIENT_ORIGIN=https://frontend-cua-ban.vercel.app` cho đúng CORS.

Code đã hỗ trợ sẵn cả hai phương án qua các biến môi trường trên.
