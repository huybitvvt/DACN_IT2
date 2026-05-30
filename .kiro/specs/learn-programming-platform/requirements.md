# Requirements Document

## Introduction

Đây là tài liệu đặc tả yêu cầu cho đồ án **Website hỗ trợ học lập trình** (tên dự án: `learn-programming-platform`). Mục tiêu của hệ thống là cung cấp một nền tảng học lập trình trực tuyến tập trung vào 4 chủ đề: **SQL, C, C++, Python**, lấy cảm hứng từ mô hình W3Schools nhưng bổ sung các tính năng tương tác mà bản gốc không có hoặc làm chưa sâu, nhằm giải quyết các khó khăn thực tế của người mới học lập trình.

Các giá trị cốt lõi tạo nên sự khác biệt của sản phẩm:

1. **Học đi đôi với hành**: người học đọc lý thuyết và chạy code ngay trên trình duyệt mà không cần cài đặt môi trường.
2. **Phản hồi tức thì**: bài tập được chấm tự động bằng test case, quiz có kết quả ngay.
3. **Trợ lý AI có giới hạn phạm vi**: một trợ lý AI (dùng Groq API kết hợp kỹ thuật RAG và system prompt) chỉ hỗ trợ các câu hỏi liên quan đến nội dung học tập trên website, đồng thời giải thích lỗi biên dịch/chạy code bằng tiếng Việt dễ hiểu.
4. **Lộ trình và theo dõi tiến độ**: người học có lộ trình rõ ràng cho từng ngôn ngữ và thấy được tiến độ của mình.

> Ghi chú kỹ thuật quan trọng: Hệ thống **không huấn luyện (train) mô hình AI** riêng. Thay vào đó, hệ thống sử dụng các mô hình ngôn ngữ có sẵn qua Groq API và giới hạn hành vi của trợ lý bằng **system prompt** kết hợp **RAG (Retrieval-Augmented Generation)** — truy xuất nội dung bài học liên quan và đưa vào ngữ cảnh trước khi sinh câu trả lời. Đây là cách tiếp cận đúng và khả thi trong phạm vi đồ án.

## Glossary

| Thuật ngữ | Giải thích |
|-----------|-----------|
| Người học (Learner) | Người dùng đã đăng ký tài khoản để học, làm bài tập, theo dõi tiến độ. |
| Khách (Guest) | Người dùng chưa đăng nhập, chỉ xem được nội dung công khai. |
| Quản trị viên (Admin) | Người quản lý nội dung bài học, bài tập, và người dùng. |
| Bài học (Lesson) | Một trang nội dung lý thuyết kèm ví dụ code, thuộc về một chủ đề/ngôn ngữ. |
| Chủ đề/Khoá học (Course) | Tập hợp các bài học của một ngôn ngữ (SQL, C, C++, Python). |
| Trình chạy code (Code Runner) | Thành phần cho phép thực thi/biên dịch code trực tiếp trên web. |
| Bài tập (Exercise) | Bài thực hành yêu cầu người học viết code, được chấm bằng test case. |
| Test case | Bộ dữ liệu đầu vào và đầu ra mong đợi dùng để chấm bài tập tự động. |
| Quiz | Câu hỏi trắc nghiệm kiểm tra kiến thức sau bài học. |
| Trợ lý AI (AI Assistant) | Chatbot hỗ trợ học tập, giới hạn phạm vi vào nội dung website. |
| RAG | Kỹ thuật truy xuất nội dung liên quan đưa vào ngữ cảnh trước khi AI trả lời. |
| Tiến độ (Progress) | Trạng thái hoàn thành bài học/bài tập của người học. |
| Streak | Chuỗi ngày học liên tục của người học. |

## Requirements

### Yêu cầu 1: Quản lý tài khoản và xác thực

**User Story:** Là một người học, tôi muốn đăng ký và đăng nhập tài khoản, để hệ thống lưu lại tiến độ và kết quả học tập của tôi.

#### Tiêu chí chấp nhận (Acceptance Criteria)

1. WHEN một khách gửi biểu mẫu đăng ký với email, tên hiển thị và mật khẩu hợp lệ THEN hệ thống SHALL tạo một tài khoản người học mới và lưu mật khẩu dưới dạng đã băm (hashed).
2. IF email đăng ký đã tồn tại trong hệ thống THEN hệ thống SHALL từ chối đăng ký và hiển thị thông báo lỗi rõ ràng.
3. WHEN một người học gửi đúng email và mật khẩu THEN hệ thống SHALL xác thực thành công và cấp một phiên đăng nhập (session/token).
4. IF người dùng nhập sai email hoặc mật khẩu THEN hệ thống SHALL từ chối đăng nhập và KHÔNG tiết lộ trường nào sai cụ thể.
5. WHEN một người học đã đăng nhập chọn đăng xuất THEN hệ thống SHALL hủy phiên đăng nhập hiện tại.
6. IF một người dùng chưa đăng nhập cố truy cập trang yêu cầu xác thực THEN hệ thống SHALL chuyển hướng tới trang đăng nhập.
7. WHERE mật khẩu được nhập khi đăng ký, hệ thống SHALL yêu cầu độ dài tối thiểu 8 ký tự và từ chối nếu không đạt.

### Yêu cầu 2: Duyệt và đọc nội dung bài học

**User Story:** Là một người học, tôi muốn duyệt và đọc các bài học theo từng ngôn ngữ, để học lý thuyết một cách có hệ thống.

#### Tiêu chí chấp nhận

1. WHEN một người dùng truy cập trang chủ THEN hệ thống SHALL hiển thị danh sách 4 khoá học: SQL, C, C++, Python.
2. WHEN một người dùng chọn một khoá học THEN hệ thống SHALL hiển thị mục lục các bài học theo thứ tự đã định.
3. WHEN một người dùng chọn một bài học THEN hệ thống SHALL hiển thị nội dung lý thuyết kèm các ví dụ code có định dạng (syntax highlighting).
4. WHILE đang xem một bài học, hệ thống SHALL hiển thị điều hướng tới bài học trước và bài học kế tiếp.
5. IF người dùng là khách (chưa đăng nhập) THEN hệ thống SHALL vẫn cho phép đọc nội dung bài học công khai.
6. WHEN một người dùng tìm kiếm theo từ khoá THEN hệ thống SHALL trả về danh sách bài học có tiêu đề hoặc nội dung khớp với từ khoá.

### Yêu cầu 3: Trình chạy code trực tiếp trên web ("Try it Yourself")

**User Story:** Là một người học, tôi muốn chỉnh sửa và chạy code ví dụ ngay trên trình duyệt, để thực hành mà không phải cài đặt môi trường.

#### Tiêu chí chấp nhận

1. WHEN một người dùng mở một ví dụ code trong bài học THEN hệ thống SHALL hiển thị một trình soạn thảo code có nội dung ví dụ và nút "Chạy".
2. WHEN một người dùng nhấn "Chạy" với code Python hoặc SQL THEN hệ thống SHALL thực thi code và hiển thị kết quả đầu ra trong khu vực kết quả.
3. WHEN một người dùng nhấn "Chạy" với code C hoặc C++ THEN hệ thống SHALL biên dịch và thực thi code qua dịch vụ thực thi code và hiển thị kết quả hoặc lỗi biên dịch.
4. IF việc thực thi code vượt quá giới hạn thời gian quy định THEN hệ thống SHALL dừng thực thi và thông báo "vượt quá thời gian cho phép".
5. IF code gây ra lỗi biên dịch hoặc lỗi runtime THEN hệ thống SHALL hiển thị thông báo lỗi đầy đủ cho người dùng.
6. WHEN người dùng chỉnh sửa code rồi chạy lại THEN hệ thống SHALL thực thi phiên bản code mới nhất.
7. WHERE code được gửi tới dịch vụ thực thi, hệ thống SHALL thực thi trong môi trường cô lập (sandbox) để không ảnh hưởng tới máy chủ.

### Yêu cầu 4: Bài tập có chấm điểm tự động

**User Story:** Là một người học, tôi muốn làm bài tập lập trình và được chấm tự động, để biết ngay code của tôi đúng hay sai.

#### Tiêu chí chấp nhận

1. WHEN một người học mở một bài tập THEN hệ thống SHALL hiển thị đề bài, code khởi tạo (nếu có) và trình soạn thảo code.
2. WHEN một người học nộp bài THEN hệ thống SHALL chạy code với tất cả test case của bài tập đó.
3. WHEN tất cả test case đều cho kết quả khớp với đầu ra mong đợi THEN hệ thống SHALL đánh dấu bài tập là "Đạt" và cập nhật tiến độ.
4. IF có ít nhất một test case không khớp THEN hệ thống SHALL đánh dấu "Chưa đạt" và hiển thị số test case đã qua trên tổng số.
5. WHERE một test case được đánh dấu là ẩn (hidden) THEN hệ thống SHALL KHÔNG hiển thị dữ liệu đầu vào/đầu ra của test case đó cho người học.
6. WHEN một người học nộp bài THEN hệ thống SHALL lưu lại lần nộp gần nhất của người học cho bài tập đó.
7. IF người dùng là khách (chưa đăng nhập) THEN hệ thống SHALL cho phép thử bài tập nhưng KHÔNG lưu kết quả.

### Yêu cầu 5: Trợ lý AI hỗ trợ học tập (giới hạn phạm vi)

**User Story:** Là một người học, tôi muốn hỏi một trợ lý AI về nội dung đang học, để được giải đáp ngay khi gặp khó khăn.

#### Tiêu chí chấp nhận

1. WHEN một người học gửi câu hỏi cho trợ lý AI THEN hệ thống SHALL gọi Groq API và trả về câu trả lời trong khung chat.
2. WHERE xử lý câu hỏi, hệ thống SHALL áp dụng kỹ thuật RAG để truy xuất nội dung bài học liên quan và đưa vào ngữ cảnh trước khi sinh câu trả lời.
3. IF câu hỏi nằm ngoài phạm vi (không liên quan đến SQL, C, C++, Python hoặc nội dung website) THEN trợ lý AI SHALL từ chối lịch sự và hướng người dùng quay lại chủ đề học tập.
4. WHEN một người học đang xem một bài học cụ thể và mở trợ lý AI THEN hệ thống SHALL đưa ngữ cảnh bài học hiện tại vào câu hỏi.
5. WHEN một người học yêu cầu giải thích một thông báo lỗi code THEN trợ lý AI SHALL giải thích nguyên nhân lỗi và gợi ý hướng sửa bằng tiếng Việt.
6. IF cuộc gọi tới Groq API thất bại hoặc hết thời gian chờ THEN hệ thống SHALL hiển thị thông báo lỗi thân thiện và cho phép thử lại.
7. WHILE trợ lý AI đang sinh câu trả lời, hệ thống SHALL hiển thị trạng thái "đang trả lời" cho người dùng.
8. WHERE khoá API Groq được sử dụng, hệ thống SHALL lưu khoá ở phía máy chủ và KHÔNG để lộ ra phía trình duyệt.

### Yêu cầu 6: Quiz kiểm tra kiến thức

**User Story:** Là một người học, tôi muốn làm quiz trắc nghiệm sau mỗi bài học, để tự kiểm tra mức độ hiểu bài.

#### Tiêu chí chấp nhận

1. WHEN một người học hoàn thành một bài học có quiz THEN hệ thống SHALL hiển thị các câu hỏi trắc nghiệm liên quan.
2. WHEN một người học nộp câu trả lời quiz THEN hệ thống SHALL chấm điểm ngay và hiển thị số câu đúng trên tổng số.
3. WHEN kết quả quiz được hiển thị THEN hệ thống SHALL chỉ ra đáp án đúng cho các câu trả lời sai.
4. IF người học đã đăng nhập THEN hệ thống SHALL lưu điểm quiz vào tiến độ học tập.

### Yêu cầu 7: Theo dõi tiến độ và lộ trình học

**User Story:** Là một người học, tôi muốn theo dõi tiến độ và có lộ trình học rõ ràng, để biết mình đang ở đâu và cần học gì tiếp theo.

#### Tiêu chí chấp nhận

1. WHEN một người học hoàn thành một bài học, bài tập hoặc quiz THEN hệ thống SHALL ghi nhận trạng thái hoàn thành tương ứng.
2. WHEN một người học mở trang lộ trình của một khoá học THEN hệ thống SHALL hiển thị danh sách các bước học theo thứ tự kèm trạng thái hoàn thành.
3. WHEN một người học mở trang cá nhân (dashboard) THEN hệ thống SHALL hiển thị phần trăm hoàn thành cho từng khoá học đã bắt đầu.
4. WHILE người học đang xem một khoá học, hệ thống SHALL hiển thị tỉ lệ bài học đã hoàn thành trên tổng số bài học của khoá đó.

### Yêu cầu 8: Tạo động lực học tập (Gamification)

**User Story:** Là một người học, tôi muốn nhận được phản hồi tạo động lực như huy hiệu và chuỗi ngày học, để duy trì hứng thú học tập.

#### Tiêu chí chấp nhận

1. WHEN một người học hoàn thành một mốc quan trọng (ví dụ hoàn thành một khoá học) THEN hệ thống SHALL trao một huy hiệu (badge) tương ứng.
2. WHEN một người học có hoạt động học tập trong một ngày THEN hệ thống SHALL ghi nhận hoạt động đó vào chuỗi ngày học (streak).
3. IF người học bỏ lỡ một ngày không có hoạt động nào THEN hệ thống SHALL đặt lại chuỗi ngày học về 0.
4. WHEN một người học mở trang cá nhân THEN hệ thống SHALL hiển thị các huy hiệu đã đạt và chuỗi ngày học hiện tại.

### Yêu cầu 9: Quản trị nội dung (Admin)

**User Story:** Là một quản trị viên, tôi muốn quản lý khoá học, bài học, bài tập và quiz, để cập nhật nội dung mà không cần sửa code.

#### Tiêu chí chấp nhận

1. IF một người dùng không có vai trò quản trị viên cố truy cập khu vực quản trị THEN hệ thống SHALL từ chối truy cập.
2. WHEN một quản trị viên tạo, sửa hoặc xoá một bài học THEN hệ thống SHALL lưu thay đổi và phản ánh trên giao diện người học.
3. WHEN một quản trị viên tạo một bài tập THEN hệ thống SHALL cho phép định nghĩa đề bài, code khởi tạo và danh sách test case (gồm test case ẩn).
4. WHEN một quản trị viên tạo hoặc sửa một quiz THEN hệ thống SHALL cho phép định nghĩa câu hỏi, các lựa chọn và đáp án đúng.
5. WHEN một quản trị viên xem danh sách người dùng THEN hệ thống SHALL hiển thị danh sách tài khoản người học.

### Yêu cầu 10: Chất lượng, bảo mật và phi chức năng

**User Story:** Là chủ sản phẩm, tôi muốn hệ thống an toàn, ổn định và dễ sử dụng, để đảm bảo trải nghiệm tốt và đạt yêu cầu đánh giá.

#### Tiêu chí chấp nhận

1. WHERE dữ liệu nhạy cảm như mật khẩu được lưu, hệ thống SHALL lưu dưới dạng băm có thêm salt, KHÔNG lưu mật khẩu dạng văn bản thường.
2. WHERE bất kỳ đầu vào nào từ người dùng được hiển thị lại hoặc đưa vào truy vấn, hệ thống SHALL xử lý chống tấn công XSS và SQL Injection.
3. WHERE các khoá bí mật (API key, chuỗi kết nối CSDL) được dùng, hệ thống SHALL lưu trong biến môi trường, KHÔNG đưa vào mã nguồn.
4. WHEN giao diện được hiển thị trên thiết bị di động THEN hệ thống SHALL hiển thị bố cục đáp ứng (responsive) dùng được trên màn hình nhỏ.
5. WHERE giao diện được xây dựng, hệ thống SHALL tuân thủ các nguyên tắc tiếp cận cơ bản (accessibility) như văn bản thay thế cho hình ảnh và tương phản màu đủ đọc.
6. WHEN người dùng thực thi code hoặc nộp bài THEN hệ thống SHALL giới hạn tần suất (rate limit) để tránh lạm dụng tài nguyên thực thi.
