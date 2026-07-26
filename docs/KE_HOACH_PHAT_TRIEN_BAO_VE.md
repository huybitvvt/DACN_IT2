# Kế hoạch phát triển tiếp để bảo vệ đồ án

Tài liệu này chuyển các nhận xét của giảng viên thành kế hoạch nâng cấp cụ thể cho CodeLearn. Mục tiêu là làm rõ: hệ thống không còn phụ thuộc vào API ngoài cho hai phần quan trọng, đồng thời có định hướng sản phẩm khác biệt để thu hút và giữ chân học viên.

## 1. Các vấn đề giảng viên góp ý

| Nhận xét | Rủi ro nếu giữ nguyên | Hướng xử lý |
|---------|------------------------|-------------|
| Dùng nhiều API ngoài | Hết quota, mất kết nối hoặc đổi chính sách là hệ thống dừng | Chuyển các lõi quan trọng sang local-first |
| Groq API không phù hợp để bảo vệ | Phụ thuộc request miễn phí, không chứng minh được năng lực tự xây dựng AI | Dùng Llama local qua OpenAI-compatible API, kết hợp RAG từ học liệu |
| Wandbox API không phù hợp | Phụ thuộc dịch vụ compile ngoài, khó kiểm soát runtime | Dùng Judge0 CE tự host local bằng Docker |
| Website chưa có điểm nổi bật đột phá | Dễ giống các web học code khác | Phát triển thi xếp hạng, phần thưởng, hoàn học phí, cá nhân hoá học tập |

## 2. Kiến trúc nâng cấp

### 2.1. Trình chạy code local bằng Judge0

Luồng mới:

1. Học viên viết code trên web.
2. Frontend gửi code tới backend qua `/api/run` hoặc `/api/exercises/:id/submit`.
3. Backend gọi Judge0 CE local tại `JUDGE0_URL`.
4. Judge0 biên dịch/chạy trong sandbox, trả stdout/stderr/compile output/time.
5. Backend so khớp output với test case, không trả dữ liệu test ẩn về client.

Ưu điểm khi trình bày:

- Không phụ thuộc Wandbox hoặc API compile ngoài.
- Chạy local được khi demo, kể cả không deploy.
- Có thể giới hạn CPU, RAM, thời gian chạy và tắt network cho code người học.
- Server vẫn là nơi chấm bài nên test case ẩn được bảo vệ.

Biến môi trường:

```ini
JUDGE0_URL=http://localhost:2358
```

### 2.2. Trợ lý AI riêng bằng Llama local

Luồng mới:

1. Học viên hỏi trợ lý AI trong bài học.
2. Backend kiểm tra câu hỏi có thuộc phạm vi lập trình hay không.
3. Backend truy xuất bài học liên quan bằng RAG.
4. Backend gửi system prompt + ngữ cảnh bài học + câu hỏi tới Llama server local.
5. Llama trả lời bằng tiếng Việt, tập trung vào SQL, C, C++ và Python.

Ưu điểm khi trình bày:

- Không dùng Groq API nên không bị hết request.
- Mô hình chạy cục bộ, có thể thay model phù hợp cấu hình máy.
- RAG dùng dữ liệu riêng của website nên trợ lý có tính cá nhân hoá theo khoá học.
- Guardrail giúp AI không trả lời lan man ngoài phạm vi đồ án.

Biến môi trường:

```ini
LOCAL_LLM_BASE_URL=http://localhost:8080/v1
LOCAL_LLM_API_KEY=
LOCAL_LLM_MODEL=local-llama
```

## 3. Tính năng tạo khác biệt sản phẩm

### 3.1. Kỳ thi theo đợt

Thêm module thi gồm:

- Mùa thi: ví dụ “Python Sprint tháng 7”, “C++ Challenge cuối khoá”.
- Đề thi: kết hợp bài code, quiz, thời gian làm bài.
- Attempt: lưu số lần nộp, điểm, thời gian hoàn thành, trạng thái.
- Công bố kết quả: chốt bảng xếp hạng sau khi hết thời gian.

Điểm khác biệt: học viên không chỉ học bài rời rạc mà có mục tiêu ngắn hạn để cố gắng.

### 3.2. Ranking có phần thưởng

Mở rộng leaderboard hiện tại thành bảng xếp hạng theo mùa:

- Điểm bài tập: cộng theo độ khó và số test pass.
- Điểm quiz: cộng theo tỷ lệ đúng.
- Điểm streak: khuyến khích học đều.
- Điểm tốc độ: thưởng nhẹ cho người hoàn thành sớm nhưng không lấn át độ chính xác.

Ví dụ chính sách thưởng:

- Top 1: hoàn 50% học phí khoá hiện tại.
- Top 2-3: voucher 30% khoá tiếp theo.
- Top 4-10: huy hiệu đặc biệt và mở bài nâng cao.
- Học viên duy trì streak 14 ngày: nhận mã ưu đãi nhỏ.

Khi bảo vệ có thể nhấn mạnh: phần thưởng không chỉ để “cho vui”, mà là cơ chế giảm bỏ học và tăng động lực hoàn thành khoá.

### 3.3. Cá nhân hoá giữ chân học viên

Đã bổ sung MVP **Trạm giữ nhịp** tại `/retention`. Hệ thống tính điểm giữ nhịp từ dữ liệu thật của người học:

- Tiến độ tổng theo khoá.
- Số ngày không hoạt động.
- Streak hiện tại.
- Huy hiệu đã đạt.
- Mùa thi và phần thưởng đang mở.

Từ đó website đưa ra:

- Mức rủi ro: đang giữ nhịp tốt, cần kéo nhịp, hoặc nguy cơ bỏ nhịp cao.
- Nhiệm vụ ưu tiên hôm nay: học bài tiếp theo, làm bài tập, làm quiz hoặc vào mùa thi.
- Gói cứu nhịp 48 giờ: hoàn thành một số nhiệm vụ ngắn để quay lại lộ trình.
- Danh sách ưu đãi có thể săn từ mùa thi đang mở.
- Hiển thị công khai từng thành phần của công thức điểm, không đưa ra một con số hộp đen.
- Lưu can thiệp, deadline, số nhiệm vụ đã hoàn thành và mức tăng/giảm điểm sau can thiệp.

Điểm khác biệt: website không chỉ hiển thị phần trăm tiến độ, mà tạo một can thiệp có thời hạn và đo kết quả sau can thiệp.

### 3.4. Can thiệp sớm cho admin/giảng viên

Đã bổ sung trang `/admin/retention` cho quản trị viên:

- Chỉ tính trên học viên đã thanh toán khoá học để tránh nhầm với người chưa bắt đầu.
- Phân nhóm rủi ro: nguy cơ cao, cần theo dõi, ổn định.
- Hiển thị điểm giữ nhịp, số ngày không học, streak, tiến độ tổng, khoá yếu nhất.
- Gợi ý hành động can thiệp: gửi nhắc học, gợi ý nhiệm vụ 15 phút, duyệt thưởng sớm, hoặc khuyến khích tham gia mùa thi.
- Có nút soạn email nhắc học nhanh cho từng học viên.
- Có thể giao trực tiếp gói cứu nhịp 48 giờ và xem can thiệp gần nhất.
- Có trung tâm thông báo trong ứng dụng; email được gửi theo tùy chọn người dùng khi SMTP/EmailJS đã cấu hình.

Như vậy hệ thống có đủ hai phía: học viên thấy nhiệm vụ cá nhân tại `/retention`, còn admin thấy nhóm cần hỗ trợ tại `/admin/retention`.

### 3.5. Hồ sơ lỗi Code DNA

Mỗi submission mới được gắn fingerprint theo ngôn ngữ và nhóm lỗi như cú pháp, biến chưa khai báo, kiểu dữ liệu, thư viện/header, bộ nhớ, định dạng output, sai thuật toán hoặc lỗi biên dịch. Trang `/learning-profile` tổng hợp:

- Tỷ lệ pass và xu hướng gần đây.
- Nhóm lỗi lặp lại nhiều nhất.
- Ngôn ngữ đang yếu.
- Bài lỗi gần đây và khuyến nghị luyện tập.

Đây là phân loại rule-based giải thích được, không quảng cáo sai là mô hình AI.

## 4. Lộ trình triển khai đề xuất

### Giai đoạn 1: Hoàn thiện tự chủ lõi

- Đổi Wandbox sang Judge0 local trong backend.
- Đổi Groq sang Llama local trong backend.
- Cập nhật `.env.example`, README và báo cáo.
- Demo được 3 luồng: chạy C/C++, nộp bài có test ẩn, hỏi AI local.

### Giai đoạn 2: Thi và ranking

- Đã bổ sung MVP gồm bảng `Contest`, `ContestReward`, `RewardClaim`, `ContestProblem`, `ContestAttempt`, API `/api/contests` và giao diện `/contests`.
- Đã seed mùa thi `CodeLearn Sprint 1` với phần thưởng hoàn 50% học phí, voucher 30% và huy hiệu đặc biệt.
- Bảng xếp hạng theo mùa hiện tính từ dữ liệu học thật: progress, submission pass, quiz attempt, streak và badge.
- Đã có trang admin `/admin/contests` để cấu hình mùa thi, phần thưởng và duyệt yêu cầu nhận thưởng.
- Đã có phòng thi riêng: học viên start attempt, làm bài trong thời gian giới hạn, submit để chốt điểm và cộng vào ranking.
- Bước tiếp theo: tự sinh phiếu hoàn học phí sau khi admin duyệt.

### Giai đoạn 3: Ưu đãi và giữ chân học viên

- Đã bổ sung trang `/retention` để học viên xem điểm giữ nhịp, mức rủi ro bỏ học, nhiệm vụ ưu tiên và ưu đãi có thể săn.
- Đã bổ sung trang `/admin/retention` để admin phát hiện học viên trả phí có nguy cơ bỏ học và can thiệp sớm.
- Đã liên kết ranking, phần thưởng, lịch sử học và thông báo.
- Đã có dashboard cảnh báo, giao can thiệp 48 giờ và đo chênh lệch điểm sau can thiệp.
- Đã có Code DNA để biến lỗi chấm bài thành hồ sơ luyện tập cá nhân.
- Bước tiếp theo: thu thập dữ liệu nhiều tuần để báo cáo tỷ lệ quay lại và hoàn thành khoá thực tế.

## 5. Kịch bản trả lời khi bảo vệ

**Câu hỏi: Vì sao không dùng Groq nữa?**

Trả lời: Ban đầu Groq giúp thử nghiệm nhanh trợ lý AI, nhưng rủi ro là phụ thuộc quota và dịch vụ ngoài. Vì vậy em chuyển sang hướng Llama local qua API tương thích OpenAI. Backend vẫn giữ RAG và guardrail, chỉ thay lớp gọi mô hình, nên hệ thống chủ động hơn và có thể chạy khi demo không cần API key.

**Câu hỏi: Vì sao dùng Judge0 thay Wandbox?**

Trả lời: Wandbox phù hợp thử nghiệm nhưng vẫn là dịch vụ compile ngoài. Judge0 CE có thể tự host local, có sandbox, hỗ trợ nhiều ngôn ngữ, trả kết quả chi tiết và cho phép cấu hình giới hạn tài nguyên. Điều này phù hợp hơn với đồ án có chấm bài tự động và test case ẩn.

**Câu hỏi: Website khác biệt gì so với web học lập trình hiện có?**

Trả lời: Điểm khác biệt nằm ở vòng kín giữ chân học viên. Hệ thống phát hiện rủi ro từ dữ liệu học thật, giải thích từng yếu tố chấm điểm, giao gói nhiệm vụ 48 giờ, nhắc trong ứng dụng/email, rồi lưu kết quả và đo mức thay đổi điểm. Ranking có thưởng và Code DNA cung cấp thêm động lực và khuyến nghị luyện tập. Từng tính năng riêng lẻ không phải chưa từng tồn tại, nhưng cách chúng liên kết thành một quy trình can thiệp đo được là luận điểm chính của đồ án.

**Câu hỏi: Phần hoàn học phí có ý nghĩa kỹ thuật gì?**

Trả lời: Về kỹ thuật, đó là module reward campaign liên kết leaderboard, thanh toán và tiến độ học. Admin cấu hình điều kiện nhận thưởng, hệ thống tự chốt ranking, ghi nhận reward claim và dùng dữ liệu này để đo mức độ giữ chân học viên.

## 6. Checklist demo trước buổi bảo vệ

- Chạy `npm run demo:up`.
- Chạy `npm run demo:smoke` và xác nhận tất cả dòng đều `OK`.
- Demo đăng ký/đăng nhập, học bài, chạy code, nộp bài, quiz, leaderboard.
- Demo AI trả lời câu hỏi trong phạm vi và từ chối câu hỏi ngoài phạm vi.
- Demo notification, Code DNA, gói cứu nhịp và dashboard admin.

## 7. Nguồn tham khảo kỹ thuật

- Judge0 CE: https://github.com/judge0/judge0
- llama.cpp server: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md
- llama-cpp-python OpenAI-compatible server: https://llama-cpp-python.readthedocs.io/en/latest/server/
