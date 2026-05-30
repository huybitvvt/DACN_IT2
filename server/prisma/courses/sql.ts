import type { SeedCourse } from '../seedData.js';

// Khoá SQL — chạy thử phía client bằng sql.js (SQLite). Bài tập tập trung lý thuyết/quiz.
export const sqlCourse: SeedCourse = {
  slug: 'sql',
  title: 'Cơ sở dữ liệu SQL',
  language: 'SQL',
  description: 'Học truy vấn dữ liệu: SELECT, WHERE, ORDER BY, các hàm gộp và JOIN.',
  order: 2,
  lessons: [
    {
      title: 'Giới thiệu SQL & SELECT',
      contentMarkdown: `# SQL là gì?

**SQL** (Structured Query Language) là ngôn ngữ chuẩn để làm việc với cơ sở dữ liệu quan hệ: truy vấn, thêm, sửa, xoá dữ liệu.

## Lệnh SELECT

Dùng để **lấy dữ liệu** từ bảng:

\`\`\`sql
SELECT * FROM users;          -- lấy tất cả cột
SELECT name, age FROM users;  -- lấy cột cụ thể
\`\`\`

Hãy chạy ví dụ bên dưới — nó tạo một bảng tạm rồi truy vấn.

> Ở các bài học SQL, code được chạy trực tiếp trên một CSDL SQLite ngay trong trình duyệt.`,
      examples: [
        {
          language: 'SQL',
          code: "CREATE TABLE users (id INTEGER, name TEXT, age INTEGER);\nINSERT INTO users VALUES (1,'An',20),(2,'Binh',22),(3,'Cuong',19);\nSELECT * FROM users;",
        },
      ],
      exercises: [],
      questions: [
        {
          text: 'Lệnh nào dùng để lấy dữ liệu từ bảng?',
          type: 'SINGLE',
          choices: [
            { text: 'GET', isCorrect: false },
            { text: 'SELECT', isCorrect: true },
            { text: 'FETCH', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Lọc dữ liệu với WHERE',
      contentMarkdown: `# Mệnh đề WHERE

\`WHERE\` giúp **lọc** các dòng thoả điều kiện.

\`\`\`sql
SELECT * FROM users WHERE age >= 20;
SELECT name FROM users WHERE name = 'An';
\`\`\`

## Toán tử thường dùng

| Toán tử | Ý nghĩa |
|---------|---------|
| \`=\` | Bằng |
| \`>\`, \`<\` | Lớn/nhỏ hơn |
| \`AND\`, \`OR\` | Kết hợp điều kiện |
| \`LIKE\` | So khớp mẫu chuỗi |

\`\`\`sql
SELECT * FROM users WHERE age > 18 AND name LIKE 'B%';
\`\`\``,
      examples: [
        {
          language: 'SQL',
          code: "CREATE TABLE users (id INTEGER, name TEXT, age INTEGER);\nINSERT INTO users VALUES (1,'An',20),(2,'Binh',22),(3,'Cuong',19);\nSELECT name, age FROM users WHERE age >= 20;",
        },
      ],
      exercises: [],
      questions: [
        {
          text: 'Mệnh đề nào dùng để lọc dòng theo điều kiện?',
          type: 'SINGLE',
          choices: [
            { text: 'FILTER', isCorrect: false },
            { text: 'WHERE', isCorrect: true },
            { text: 'HAVING', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Sắp xếp & hàm gộp',
      contentMarkdown: `# ORDER BY và hàm gộp

## Sắp xếp kết quả

\`\`\`sql
SELECT * FROM users ORDER BY age DESC;  -- giảm dần
SELECT * FROM users ORDER BY name ASC;  -- tăng dần
\`\`\`

## Các hàm gộp (aggregate)

| Hàm | Ý nghĩa |
|-----|---------|
| \`COUNT(*)\` | Đếm số dòng |
| \`SUM(col)\` | Tổng |
| \`AVG(col)\` | Trung bình |
| \`MAX/MIN\` | Lớn nhất/nhỏ nhất |

\`\`\`sql
SELECT COUNT(*) AS so_nguoi, AVG(age) AS tuoi_tb FROM users;
\`\`\`

> Kết hợp \`GROUP BY\` để gộp theo nhóm và \`HAVING\` để lọc nhóm.`,
      examples: [
        {
          language: 'SQL',
          code: "CREATE TABLE users (id INTEGER, name TEXT, age INTEGER);\nINSERT INTO users VALUES (1,'An',20),(2,'Binh',22),(3,'Cuong',19);\nSELECT COUNT(*) AS so_nguoi, AVG(age) AS tuoi_tb FROM users;",
        },
      ],
      exercises: [],
      questions: [
        {
          text: 'Hàm nào đếm số dòng?',
          type: 'SINGLE',
          choices: [
            { text: 'SUM()', isCorrect: false },
            { text: 'COUNT()', isCorrect: true },
            { text: 'TOTAL()', isCorrect: false },
          ],
        },
        {
          text: 'Từ khoá nào sắp xếp giảm dần?',
          type: 'SINGLE',
          choices: [
            { text: 'DESC', isCorrect: true },
            { text: 'ASC', isCorrect: false },
            { text: 'DOWN', isCorrect: false },
          ],
        },
      ],
    },
  ],
};
