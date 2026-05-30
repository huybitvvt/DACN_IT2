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
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start --workspace server`
3. Thêm **Environment Variables** (tab Environment):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | dán Internal Database URL ở Bước 2 |
| `JWT_SECRET` | một chuỗi ngẫu nhiên dài bất kỳ |
| `JWT_EXPIRES_IN` | `7d` |
| `GROQ_API_KEY` | khoá Groq của bạn |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `WANDBOX_URL` | `https://wandbox.org` |
| `CLIENT_ORIGIN` | URL service (điền sau khi có, vd `https://codelearn.onrender.com`) |

4. **Create Web Service**. Render sẽ build (lần đầu ~5-10 phút).

### Bước 4 — Tạo bảng & nạp dữ liệu (chạy 1 lần)

Sau khi deploy xong, mở tab **Shell** của web service trên Render và chạy:

```bash
npm run prisma:deploy --workspace server   # tạo bảng
npm run seed --workspace server            # nạp 4 khoá học + admin
```

> Hoặc dùng file `render.yaml` có sẵn trong repo (Blueprint) để Render tự cấu hình:
> **New +** → **Blueprint** → chọn repo. Khi đó migration chạy tự động ở `preDeployCommand`.

### Bước 5 — Hoàn tất

- Mở URL Render cấp (vd `https://codelearn.onrender.com`)
- Đăng nhập admin: `admin@lpp.local` / `admin12345`
- Cập nhật biến `CLIENT_ORIGIN` = đúng URL này rồi **Save** (service tự deploy lại)

---

## Lưu ý quan trọng

- **Gói Free của Render "ngủ" sau 15 phút không dùng** → lần truy cập đầu sau đó mất
  ~30-60 giây để khởi động lại. Bình thường với bản demo. Trước buổi bảo vệ, hãy truy cập
  trước 1-2 phút cho nó "thức dậy".
- **Trợ lý AI lần đầu tải model embedding (~120MB)** nên câu hỏi AI đầu tiên hơi lâu.
  Có thể bỏ qua bằng cách để RAG fallback full-text (xem `docs/NANG_CAP.md`).
- **Chạy code C/C++** gọi Wandbox (Internet) — Render có Internet nên chạy bình thường.
- **Bí mật**: không commit `.env`. Mọi khoá điền trực tiếp trong dashboard Render.

---

## Phương án thay thế: deploy tách 2 domain (nâng cao)

Nếu muốn frontend (Vercel/Netlify) và backend (Render) ở 2 domain riêng:

1. Backend (Render): đặt thêm biến `CROSS_SITE_COOKIE=true` để cookie dùng
   `SameSite=None; Secure` (gửi được cross-site).
2. Frontend (Vercel): đặt biến `VITE_API_URL=https://backend-cua-ban.onrender.com/api`.
3. Backend: đặt `CLIENT_ORIGIN=https://frontend-cua-ban.vercel.app` cho đúng CORS.

Code đã hỗ trợ sẵn cả hai phương án qua các biến môi trường trên.
