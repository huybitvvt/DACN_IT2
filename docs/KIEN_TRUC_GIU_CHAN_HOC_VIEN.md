# Kiến trúc giữ chân học viên CodeLearn

## 1. Luận điểm sản phẩm

CodeLearn không tuyên bố từng tính năng riêng lẻ là chưa từng xuất hiện. Điểm khác biệt có thể bảo vệ bằng code và dữ liệu là một vòng kín:

1. Thu thập tiến độ, submission, quiz và hoạt động thi theo mốc thời gian.
2. Chấm điểm rủi ro bằng công thức giải thích được.
3. Giao gói cứu nhịp gồm tối đa ba nhiệm vụ trong 48 giờ.
4. Nhắc người học trong ứng dụng và qua email nếu đã cấu hình.
5. Đồng bộ trạng thái nhiệm vụ từ dữ liệu học thật.
6. Lưu tỷ lệ hoàn thành và chênh lệch điểm sau can thiệp.

## 2. Công thức điểm giữ nhịp

Phiên bản `RETENTION_V3_2026_07` có tổng 100 điểm và ưu tiên hành vi gần đây. Streak, huy hiệu hoặc tiến độ tích lũy cũ không còn đủ sức che lấp việc người học đã ngừng học.

| Thành phần | Điểm tối đa | Cách tính chính |
|---|---:|---|
| Hoạt động gần nhất | 25 | Giảm theo số ngày không học: 25 điểm nếu học hôm nay và về 0 sau hơn 14 ngày |
| Độ đều 14 ngày | 20 | `min(số ngày học / 6 x 20, 20)` |
| Tiến độ | 20 | Tối đa 8 điểm nền theo tiến độ tổng và 12 điểm theo nội dung mới hoàn thành trong 14 ngày |
| Chất lượng thực hành | 25 | 15 điểm theo tỷ lệ bài code duy nhất đã pass và 10 điểm theo trung bình kết quả tốt nhất của từng quiz |
| Xu hướng tuần | 10 | 6 điểm theo khối lượng tuần này và 4 điểm khi duy trì hoặc tăng so với tuần trước |

Hai luật chặn xử lý trường hợp công thức cộng vẫn cho điểm quá cao:

- Không học từ 14 ngày trở lên luôn là `AT_RISK`.
- Không học từ 7 ngày trở lên không thể là `ON_TRACK`.

Ngưỡng còn lại là `ON_TRACK` từ 70 điểm, `WATCH` từ 45 điểm và `AT_RISK` dưới 45 điểm. API trả phiên bản công thức, điểm từng thành phần và lý do nên kết quả có thể giải thích được.

Hệ thống dựng lại 28 mốc điểm theo ngày từ lịch sử học thật. Biểu đồ tại `/retention` hiển thị đường điểm, vùng rủi ro, chênh lệch 7 ngày, điểm trung bình và điểm tốt nhất. Hệ thống chỉ đánh giá nguy cơ với người đã thanh toán khóa học.

## 2.1. Công thức thi đua

Phiên bản `COMPETITION_V2_1000` chuẩn hóa điểm mùa thi về tối đa 1.000:

| Thành phần | Điểm tối đa | Quy tắc chống cày điểm |
|---|---:|---|
| Học bài | 200 | 20 điểm cho mỗi lesson duy nhất |
| Thực hành code | 250 | 35 điểm cho mỗi exercise duy nhất đã pass |
| Quiz | 150 | Tối đa 30 điểm/quiz theo kết quả tốt nhất |
| Phòng thi | 300 | Chuẩn hóa theo `điểm đạt được / tổng điểm đề` |
| Học đều | 100 | Theo số ngày có hoạt động; mục tiêu 3 ngày/tuần, tối đa 12 ngày |

Chỉ hoạt động trong thời gian mùa thi và của học viên đã thanh toán mới được tính. Hệ thống không cộng lặp một exercise hoặc quiz, không dùng huy hiệu cũ và không dùng streak ngoài mùa. Khi bằng điểm, thứ tự ưu tiên lần lượt là phòng thi, thực hành, quiz, độ đều và thời điểm đạt điểm sớm hơn.

## 3. Vòng can thiệp

`LearningIntervention` lưu nguồn tạo, lý do, điểm nền, deadline, trạng thái và kết quả. `InterventionMission` liên kết nhiệm vụ với lesson, exercise, quiz hoặc contest.

- `ACTIVE`: đang trong 48 giờ.
- `COMPLETED`: đạt đủ số nhiệm vụ mục tiêu.
- `EXPIRED`: hết hạn trước khi hoàn thành.
- Kết quả gồm số nhiệm vụ hoàn thành, tỷ lệ hoàn thành, thời gian và chênh lệch điểm.

Admin giao can thiệp tại `/admin/retention`; học viên theo dõi tại `/retention`.

## 4. Trung tâm thông báo

Thông báo được lưu trong database, có trạng thái đã đọc và `dedupeKey` chống tạo trùng. Các sự kiện chính:

- Thanh toán thành công và mở khóa học.
- Gửi, duyệt hoặc từ chối yêu cầu nhận thưởng.
- Mùa thi sắp bắt đầu hoặc kết thúc.
- Học viên có nguy cơ mất nhịp hoặc được giao can thiệp.
- Nhận huy hiệu mới.

Chuông trên header polling mỗi 20 giây. Email là kênh bổ sung theo tùy chọn người dùng; thông báo trong ứng dụng vẫn hoạt động khi chưa cấu hình SMTP/EmailJS.

## 5. Code DNA

Submission được gắn `errorCategory`, `errorFingerprint` và `errorSummary`. Bộ phân loại rule-based sử dụng trạng thái Judge0, compile output, source code và số test pass để phát hiện các nhóm lỗi phổ biến.

Trang `/learning-profile` hiển thị tỷ lệ pass, xu hướng, nhóm lỗi lặp lại, ngôn ngữ và khuyến nghị. Dữ liệu cũ được backfill ở mức tổng quát; submission mới có chẩn đoán chi tiết hơn.

## 6. Thanh toán và demo

Luồng thật nhận SePay webhook qua `/api/payments/sepay/webhook`, xác thực API key và cập nhật `CoursePurchase`. Khi chạy local, Cloudflare Quick Tunnel đưa webhook công khai về backend.

`PAYMENT_DEMO_ENABLED=true` mở nút xác nhận demo, nhưng backend tự vô hiệu hóa chức năng này khi `NODE_ENV=production`. Chế độ demo dùng đúng service cập nhật purchase và notification, không sửa trạng thái giả chỉ ở frontend.

## 7. API chính

| API | Mục đích |
|---|---|
| `GET /api/notifications` | Danh sách và số thông báo chưa đọc |
| `PUT /api/notifications/:id/read` | Đánh dấu đã đọc |
| `GET /api/retention/plan` | Điểm, lý do, nhiệm vụ và can thiệp |
| `GET /api/retention/interventions` | Lịch sử can thiệp |
| `GET /api/learning/error-profile` | Hồ sơ lỗi Code DNA |
| `GET /api/admin/retention-risks` | Danh sách học viên trả phí có rủi ro |
| `POST /api/admin/retention-interventions/:id` | Giao gói cứu nhịp |

## 8. Đánh giá khắt khe

Điểm mạnh hiện tại là chiều sâu tích hợp, khả năng chạy local và dữ liệu giải thích được. Đây không còn là CRUD khóa học đơn thuần.

Các giới hạn cần nói rõ khi bảo vệ:

- Công thức rủi ro là heuristic có phiên bản, chưa phải mô hình dự đoán đã được kiểm định trên dữ liệu lớn.
- Model Qwen 1.5B local phù hợp demo nhưng chất lượng suy luận thấp hơn model lớn.
- Quick Tunnel có URL thay đổi; production cần domain/tunnel cố định và backend luôn hoạt động.
- Email phụ thuộc cấu hình nhà cung cấp, nhưng kênh thông báo trong ứng dụng không phụ thuộc email.
- Muốn chứng minh hiệu quả giữ chân cần dữ liệu theo tuần: tỷ lệ quay lại, hoàn thành can thiệp và thay đổi tiến độ.

## 9. Chỉ số nên trình bày

- Số học viên trả phí theo từng mức rủi ro.
- Số can thiệp active/completed/expired.
- Tỷ lệ hoàn thành nhiệm vụ cứu nhịp.
- Điểm trước và sau can thiệp.
- Tỷ lệ pass theo ngôn ngữ và nhóm lỗi phổ biến.
- Tỷ lệ người nhận thông báo quay lại học trong 24/48 giờ.

Khi chưa có dữ liệu thực nghiệm đủ dài, cần gọi đây là chỉ số hệ thống đã sẵn sàng thu thập, không trình bày như kết quả đã được chứng minh.
