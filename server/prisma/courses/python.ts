import type { SeedCourse } from '../seedData.js';

// Khoá Python đầy đủ — nội dung bài bản theo phong cách giáo trình thật.
export const pythonCourse: SeedCourse = {
  slug: 'python',
  title: 'Lập trình Python',
  language: 'PYTHON',
  description: 'Khoá học Python từ con số 0: cú pháp, biến, điều kiện, vòng lặp, hàm và cấu trúc dữ liệu.',
  order: 1,
  lessons: [
    {
      title: 'Giới thiệu Python',
      contentMarkdown: `# Python là gì?

**Python** là ngôn ngữ lập trình bậc cao, được Guido van Rossum tạo ra năm 1991. Python nổi tiếng vì cú pháp **đơn giản, dễ đọc**, gần với ngôn ngữ tự nhiên.

## Python dùng để làm gì?

- Phát triển web (Django, Flask)
- Khoa học dữ liệu & trí tuệ nhân tạo (pandas, TensorFlow)
- Tự động hoá, scripting
- Lập trình game, ứng dụng desktop

## Vì sao nên học Python?

| Ưu điểm | Mô tả |
|---------|-------|
| Dễ học | Cú pháp rõ ràng, ít ký hiệu rườm rà |
| Đa năng | Dùng được trong hầu hết lĩnh vực |
| Cộng đồng lớn | Nhiều thư viện, tài liệu phong phú |

> Python phù hợp cho cả người mới bắt đầu lẫn lập trình viên chuyên nghiệp.

## Chương trình đầu tiên

Trong Python, để in nội dung ra màn hình ta dùng hàm \`print()\`:

\`\`\`python
print("Hello, World!")
\`\`\`

Hãy thử chạy ví dụ bên dưới và thay đổi nội dung trong dấu ngoặc kép.`,
      examples: [{ language: 'PYTHON', code: 'print("Hello, World!")\nprint("Chào mừng đến với Python!")' }],
      exercises: [
        {
          title: 'In ra lời chào',
          promptMarkdown: 'Viết chương trình in ra đúng dòng chữ: `Hello, World!`',
          language: 'PYTHON',
          starterCode: '# Viết code của bạn ở đây\n',
          testCases: [{ input: '', expectedOutput: 'Hello, World!', isHidden: false }],
        },
      ],
      questions: [
        {
          text: 'Hàm nào dùng để in ra màn hình trong Python?',
          type: 'SINGLE',
          choices: [
            { text: 'echo()', isCorrect: false },
            { text: 'print()', isCorrect: true },
            { text: 'printf()', isCorrect: false },
            { text: 'console.log()', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Biến và kiểu dữ liệu',
      contentMarkdown: `# Biến trong Python

**Biến** là tên gọi dùng để lưu trữ dữ liệu. Python tự suy ra kiểu dữ liệu, bạn không cần khai báo trước.

\`\`\`python
ten = "An"        # chuỗi (str)
tuoi = 20          # số nguyên (int)
chieu_cao = 1.7    # số thực (float)
da_di_hoc = True   # luận lý (bool)
\`\`\`

## Các kiểu dữ liệu cơ bản

| Kiểu | Ví dụ | Mô tả |
|------|-------|-------|
| \`int\` | \`10\`, \`-5\` | Số nguyên |
| \`float\` | \`3.14\` | Số thực |
| \`str\` | \`"hello"\` | Chuỗi ký tự |
| \`bool\` | \`True\`, \`False\` | Đúng/Sai |

## Quy tắc đặt tên biến

- Bắt đầu bằng chữ cái hoặc dấu gạch dưới \`_\`
- Không chứa khoảng trắng (dùng \`snake_case\`)
- Phân biệt chữ hoa/thường: \`tuoi\` khác \`Tuoi\`

## Kiểm tra kiểu dữ liệu

\`\`\`python
x = 5
print(type(x))   # <class 'int'>
\`\`\``,
      examples: [
        { language: 'PYTHON', code: 'ten = "An"\ntuoi = 20\nprint(ten, "năm nay", tuoi, "tuổi")' },
      ],
      exercises: [
        {
          title: 'Tính tổng hai số',
          promptMarkdown: 'Đọc hai số nguyên trên hai dòng và in ra **tổng** của chúng.',
          language: 'PYTHON',
          starterCode: 'a = int(input())\nb = int(input())\n# in ra tổng\n',
          testCases: [
            { input: '2\n3', expectedOutput: '5', isHidden: false },
            { input: '10\n20', expectedOutput: '30', isHidden: false },
            { input: '-5\n5', expectedOutput: '0', isHidden: true },
            { input: '1000\n2345', expectedOutput: '3345', isHidden: true },
          ],
        },
      ],
      questions: [
        {
          text: 'Kiểu dữ liệu của giá trị 1.7 là gì?',
          type: 'SINGLE',
          choices: [
            { text: 'int', isCorrect: false },
            { text: 'float', isCorrect: true },
            { text: 'str', isCorrect: false },
          ],
        },
        {
          text: 'Cách đặt tên biến nào sau đây hợp lệ trong Python?',
          type: 'MULTI',
          choices: [
            { text: 'so_luong', isCorrect: true },
            { text: '_tong', isCorrect: true },
            { text: '2ten', isCorrect: false },
            { text: 'gia tri', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Chuỗi (String)',
      contentMarkdown: `# Chuỗi trong Python

**Chuỗi** (string) là dãy ký tự, đặt trong dấu nháy đơn \`'\` hoặc nháy kép \`"\`.

\`\`\`python
loi_chao = "Xin chào"
ten = 'Python'
\`\`\`

## Nối chuỗi

Dùng toán tử \`+\` để nối, hoặc **f-string** để chèn biến:

\`\`\`python
ten = "An"
print("Chào " + ten)
print(f"Chào {ten}, chúc bạn học tốt!")
\`\`\`

## Một số thao tác thường dùng

| Thao tác | Ý nghĩa |
|----------|---------|
| \`len(s)\` | Độ dài chuỗi |
| \`s.upper()\` | Viết hoa toàn bộ |
| \`s.lower()\` | Viết thường toàn bộ |
| \`s.strip()\` | Bỏ khoảng trắng đầu/cuối |
| \`s[0]\` | Ký tự đầu tiên |

> Chuỗi trong Python **bất biến** (immutable): không thể đổi từng ký tự sau khi tạo.`,
      examples: [
        { language: 'PYTHON', code: 'ten = "python"\nprint(ten.upper())\nprint(f"Độ dài: {len(ten)}")' },
      ],
      exercises: [
        {
          title: 'Chào theo tên',
          promptMarkdown: 'Đọc một tên từ bàn phím và in ra: `Xin chào, <tên>!`',
          language: 'PYTHON',
          starterCode: 'ten = input()\n# in lời chào\n',
          testCases: [
            { input: 'An', expectedOutput: 'Xin chào, An!', isHidden: false },
            { input: 'Bình', expectedOutput: 'Xin chào, Bình!', isHidden: true },
          ],
        },
      ],
      questions: [
        {
          text: 'Kết quả của `len("Python")` là bao nhiêu?',
          type: 'SINGLE',
          choices: [
            { text: '5', isCorrect: false },
            { text: '6', isCorrect: true },
            { text: '7', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Câu lệnh điều kiện if...else',
      contentMarkdown: `# Câu lệnh điều kiện

Dùng \`if\`, \`elif\`, \`else\` để rẽ nhánh chương trình theo điều kiện.

\`\`\`python
tuoi = 18
if tuoi >= 18:
    print("Đủ tuổi")
else:
    print("Chưa đủ tuổi")
\`\`\`

## Toán tử so sánh

| Toán tử | Ý nghĩa |
|---------|---------|
| \`==\` | Bằng |
| \`!=\` | Khác |
| \`>\` \`<\` | Lớn hơn / nhỏ hơn |
| \`>=\` \`<=\` | Lớn/nhỏ hơn hoặc bằng |

## Nhiều nhánh với elif

\`\`\`python
diem = 7
if diem >= 8:
    print("Giỏi")
elif diem >= 6.5:
    print("Khá")
else:
    print("Trung bình")
\`\`\`

> **Lưu ý quan trọng:** Python dùng **thụt lề** (indentation) để xác định khối lệnh, không dùng dấu ngoặc nhọn. Hãy thụt lề nhất quán (thường là 4 dấu cách).`,
      examples: [
        { language: 'PYTHON', code: 'n = 7\nif n % 2 == 0:\n    print("Chẵn")\nelse:\n    print("Lẻ")' },
      ],
      exercises: [
        {
          title: 'Kiểm tra chẵn lẻ',
          promptMarkdown: 'Đọc một số nguyên. In `Chan` nếu là số chẵn, ngược lại in `Le`.',
          language: 'PYTHON',
          starterCode: 'n = int(input())\n# kiểm tra chẵn lẻ\n',
          testCases: [
            { input: '4', expectedOutput: 'Chan', isHidden: false },
            { input: '7', expectedOutput: 'Le', isHidden: false },
            { input: '0', expectedOutput: 'Chan', isHidden: true },
            { input: '-3', expectedOutput: 'Le', isHidden: true },
          ],
        },
      ],
      questions: [
        {
          text: 'Python dùng gì để xác định khối lệnh?',
          type: 'SINGLE',
          choices: [
            { text: 'Dấu ngoặc nhọn { }', isCorrect: false },
            { text: 'Thụt lề (indentation)', isCorrect: true },
            { text: 'Dấu chấm phẩy ;', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Vòng lặp for và while',
      contentMarkdown: `# Vòng lặp

Vòng lặp giúp lặp lại một khối lệnh nhiều lần.

## Vòng lặp for

\`\`\`python
for i in range(5):
    print(i)   # in 0,1,2,3,4
\`\`\`

\`range(a, b)\` tạo dãy số từ \`a\` đến \`b-1\`.

## Vòng lặp while

\`\`\`python
i = 1
while i <= 5:
    print(i)
    i += 1
\`\`\`

## break và continue

| Lệnh | Ý nghĩa |
|------|---------|
| \`break\` | Thoát khỏi vòng lặp |
| \`continue\` | Bỏ qua lượt hiện tại, sang lượt kế tiếp |

\`\`\`python
for i in range(10):
    if i == 5:
        break
    print(i)
\`\`\``,
      examples: [
        { language: 'PYTHON', code: 'tong = 0\nfor i in range(1, 6):\n    tong += i\nprint("Tổng 1..5 =", tong)' },
      ],
      exercises: [
        {
          title: 'Tính giai thừa',
          promptMarkdown: 'Đọc số nguyên dương `n` và in ra **n!** (n giai thừa). Ví dụ 5! = 120.',
          language: 'PYTHON',
          starterCode: 'n = int(input())\n# tính n!\n',
          testCases: [
            { input: '5', expectedOutput: '120', isHidden: false },
            { input: '1', expectedOutput: '1', isHidden: false },
            { input: '0', expectedOutput: '1', isHidden: true },
            { input: '10', expectedOutput: '3628800', isHidden: true },
          ],
        },
      ],
      questions: [
        {
          text: '`range(5)` tạo ra dãy số nào?',
          type: 'SINGLE',
          choices: [
            { text: '1, 2, 3, 4, 5', isCorrect: false },
            { text: '0, 1, 2, 3, 4', isCorrect: true },
            { text: '0, 1, 2, 3, 4, 5', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Danh sách (List)',
      contentMarkdown: `# Danh sách trong Python

**List** là tập hợp có thứ tự, có thể thay đổi, chứa nhiều phần tử.

\`\`\`python
so = [1, 2, 3, 4, 5]
ten = ["An", "Bình", "Cường"]
\`\`\`

## Truy cập phần tử

\`\`\`python
print(so[0])    # phần tử đầu: 1
print(so[-1])   # phần tử cuối: 5
\`\`\`

## Thao tác thường dùng

| Phương thức | Ý nghĩa |
|-------------|---------|
| \`append(x)\` | Thêm x vào cuối |
| \`remove(x)\` | Xoá phần tử x |
| \`len(ds)\` | Số phần tử |
| \`sum(ds)\` | Tổng các phần tử |
| \`sorted(ds)\` | Sắp xếp |

## Duyệt danh sách

\`\`\`python
for x in [10, 20, 30]:
    print(x)
\`\`\``,
      examples: [
        { language: 'PYTHON', code: 'so = [5, 2, 8, 1]\nprint("Lớn nhất:", max(so))\nprint("Đã sắp xếp:", sorted(so))' },
      ],
      exercises: [
        {
          title: 'Tổng các phần tử',
          promptMarkdown: 'Dòng đầu là số lượng phần tử `n`. Dòng sau là `n` số cách nhau bởi dấu cách. In ra tổng của chúng.',
          language: 'PYTHON',
          starterCode: 'n = int(input())\nso = list(map(int, input().split()))\n# in tổng\n',
          testCases: [
            { input: '3\n1 2 3', expectedOutput: '6', isHidden: false },
            { input: '5\n10 20 30 40 50', expectedOutput: '150', isHidden: true },
          ],
        },
      ],
      questions: [
        {
          text: 'Phương thức nào thêm phần tử vào cuối danh sách?',
          type: 'SINGLE',
          choices: [
            { text: 'add()', isCorrect: false },
            { text: 'append()', isCorrect: true },
            { text: 'push()', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Hàm (Function)',
      contentMarkdown: `# Hàm trong Python

**Hàm** là khối lệnh có tên, dùng để tái sử dụng code. Khai báo bằng từ khoá \`def\`.

\`\`\`python
def chao(ten):
    print(f"Xin chào, {ten}!")

chao("An")   # gọi hàm
\`\`\`

## Hàm có giá trị trả về

\`\`\`python
def cong(a, b):
    return a + b

ket_qua = cong(3, 5)
print(ket_qua)   # 8
\`\`\`

## Tham số mặc định

\`\`\`python
def chao(ten="bạn"):
    print(f"Chào {ten}")

chao()        # Chào bạn
chao("An")    # Chào An
\`\`\`

> Hàm giúp chia nhỏ chương trình, dễ đọc và dễ bảo trì hơn.`,
      examples: [
        { language: 'PYTHON', code: 'def binh_phuong(x):\n    return x * x\n\nprint(binh_phuong(5))' },
      ],
      exercises: [
        {
          title: 'Hàm tìm số lớn nhất',
          promptMarkdown: 'Đọc 3 số nguyên trên 3 dòng. Viết hàm trả về số lớn nhất và in ra kết quả.',
          language: 'PYTHON',
          starterCode: 'a = int(input())\nb = int(input())\nc = int(input())\n# tìm và in số lớn nhất\n',
          testCases: [
            { input: '3\n7\n5', expectedOutput: '7', isHidden: false },
            { input: '10\n2\n8', expectedOutput: '10', isHidden: false },
            { input: '-1\n-5\n-3', expectedOutput: '-1', isHidden: true },
          ],
        },
      ],
      questions: [
        {
          text: 'Từ khoá nào dùng để định nghĩa hàm trong Python?',
          type: 'SINGLE',
          choices: [
            { text: 'function', isCorrect: false },
            { text: 'def', isCorrect: true },
            { text: 'func', isCorrect: false },
          ],
        },
        {
          text: 'Từ khoá nào dùng để trả về giá trị từ hàm?',
          type: 'SINGLE',
          choices: [
            { text: 'return', isCorrect: true },
            { text: 'yield', isCorrect: false },
            { text: 'output', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Từ điển (Dictionary)',
      contentMarkdown: `# Từ điển trong Python

**Dictionary** lưu dữ liệu dạng cặp **khoá - giá trị** (key - value).

\`\`\`python
sinh_vien = {
    "ten": "An",
    "tuoi": 20,
    "lop": "CNTT3"
}
print(sinh_vien["ten"])   # An
\`\`\`

## Thao tác thường dùng

| Thao tác | Ý nghĩa |
|----------|---------|
| \`d[key]\` | Lấy giá trị theo khoá |
| \`d[key] = v\` | Thêm/cập nhật |
| \`d.keys()\` | Tất cả khoá |
| \`d.values()\` | Tất cả giá trị |
| \`key in d\` | Kiểm tra khoá tồn tại |

## Duyệt từ điển

\`\`\`python
for key, value in sinh_vien.items():
    print(key, "=", value)
\`\`\`

> Dictionary rất nhanh khi tra cứu theo khoá, phù hợp lưu dữ liệu có cấu trúc.`,
      examples: [
        { language: 'PYTHON', code: 'gia = {"tao": 15000, "cam": 20000}\nfor ten, g in gia.items():\n    print(ten, ":", g, "đ")' },
      ],
      exercises: [
        {
          title: 'Đếm tần suất ký tự',
          promptMarkdown: 'Đọc một chuỗi và in ra số lần xuất hiện của ký tự `a` (chữ thường) trong chuỗi đó.',
          language: 'PYTHON',
          starterCode: 's = input()\n# đếm số ký tự "a"\n',
          testCases: [
            { input: 'banana', expectedOutput: '3', isHidden: false },
            { input: 'python', expectedOutput: '0', isHidden: false },
            { input: 'alabama', expectedOutput: '4', isHidden: true },
          ],
        },
      ],
      questions: [
        {
          text: 'Dictionary lưu dữ liệu theo dạng nào?',
          type: 'SINGLE',
          choices: [
            { text: 'Cặp khoá - giá trị', isCorrect: true },
            { text: 'Danh sách có thứ tự', isCorrect: false },
            { text: 'Tập hợp không trùng lặp', isCorrect: false },
          ],
        },
      ],
    },
  ],
};
