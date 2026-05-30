// Dữ liệu mẫu cho 4 khoá học. Tách riêng để seed.ts gọn và dễ mở rộng.
// Ngôn ngữ Judge0 id: C (50), C++ (54), Python (71). SQL chạy client-side.

export type Lang = 'SQL' | 'C' | 'CPP' | 'PYTHON';

export interface SeedChoice {
  text: string;
  isCorrect: boolean;
}
export interface SeedQuestion {
  text: string;
  type: 'SINGLE' | 'MULTI';
  choices: SeedChoice[];
}
export interface SeedTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}
export interface SeedExercise {
  title: string;
  promptMarkdown: string;
  language: Lang;
  starterCode: string;
  testCases: SeedTestCase[];
}
export interface SeedExample {
  language: Lang;
  code: string;
}
export interface SeedLesson {
  title: string;
  contentMarkdown: string;
  examples: SeedExample[];
  exercises: SeedExercise[];
  questions: SeedQuestion[];
}
export interface SeedCourse {
  slug: string;
  title: string;
  language: Lang;
  description: string;
  order: number;
  lessons: SeedLesson[];
}

export const courses: SeedCourse[] = [
  {
    slug: 'python',
    title: 'Lập trình Python',
    language: 'PYTHON',
    description: 'Ngôn ngữ dễ học, đa năng. Bắt đầu hành trình lập trình tại đây.',
    order: 1,
    lessons: [
      {
        title: 'Giới thiệu & Hello World',
        contentMarkdown:
          '# Python là gì?\n\nPython là ngôn ngữ lập trình bậc cao, cú pháp gần với ngôn ngữ tự nhiên nên rất dễ học.\n\n## In ra màn hình\n\nDùng hàm `print()` để hiển thị nội dung:\n\n```python\nprint("Hello, World!")\n```',
        examples: [{ language: 'PYTHON', code: 'print("Hello, World!")' }],
        exercises: [
          {
            title: 'In ra lời chào',
            promptMarkdown: 'Viết chương trình in ra đúng dòng chữ: `Hello, World!`',
            language: 'PYTHON',
            starterCode: '# Viết code của bạn ở đây\n',
            testCases: [
              { input: '', expectedOutput: 'Hello, World!', isHidden: false },
            ],
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
        contentMarkdown:
          '# Biến trong Python\n\nBiến dùng để lưu trữ dữ liệu. Python tự suy ra kiểu dữ liệu.\n\n```python\nten = "An"\ntuoi = 20\ncao = 1.7\n```\n\nCác kiểu cơ bản: `int`, `float`, `str`, `bool`.',
        examples: [
          { language: 'PYTHON', code: 'x = 5\ny = 3\nprint(x + y)' },
        ],
        exercises: [
          {
            title: 'Tính tổng hai số',
            promptMarkdown:
              'Đọc hai số nguyên trên hai dòng và in ra tổng của chúng.',
            language: 'PYTHON',
            starterCode: 'a = int(input())\nb = int(input())\n# in ra tổng\n',
            testCases: [
              { input: '2\n3', expectedOutput: '5', isHidden: false },
              { input: '10\n20', expectedOutput: '30', isHidden: false },
              { input: '-5\n5', expectedOutput: '0', isHidden: true },
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
        ],
      },
    ],
  },
  {
    slug: 'sql',
    title: 'Cơ sở dữ liệu SQL',
    language: 'SQL',
    description: 'Truy vấn và quản lý dữ liệu với ngôn ngữ SQL.',
    order: 2,
    lessons: [
      {
        title: 'SELECT cơ bản',
        contentMarkdown:
          '# Truy vấn SELECT\n\nLệnh `SELECT` dùng để lấy dữ liệu từ bảng.\n\n```sql\nSELECT * FROM users;\n```\n\nChọn cột cụ thể:\n\n```sql\nSELECT name, age FROM users;\n```',
        examples: [
          {
            language: 'SQL',
            code: "CREATE TABLE users (id INTEGER, name TEXT);\nINSERT INTO users VALUES (1, 'An'), (2, 'Binh');\nSELECT * FROM users;",
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
    ],
  },
  {
    slug: 'c',
    title: 'Lập trình C',
    language: 'C',
    description: 'Ngôn ngữ nền tảng, gần với phần cứng, nền móng cho mọi ngôn ngữ.',
    order: 3,
    lessons: [
      {
        title: 'Chương trình C đầu tiên',
        contentMarkdown:
          '# Cấu trúc chương trình C\n\nMọi chương trình C bắt đầu từ hàm `main()`.\n\n```c\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n```',
        examples: [
          {
            language: 'C',
            code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
          },
        ],
        exercises: [
          {
            title: 'In tổng hai số (C)',
            promptMarkdown: 'Đọc hai số nguyên và in ra tổng của chúng.',
            language: 'C',
            starterCode:
              '#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    // in ra tổng\n    return 0;\n}',
            testCases: [
              { input: '2 3', expectedOutput: '5', isHidden: false },
              { input: '100 200', expectedOutput: '300', isHidden: true },
            ],
          },
        ],
        questions: [
          {
            text: 'Hàm nào là điểm bắt đầu của chương trình C?',
            type: 'SINGLE',
            choices: [
              { text: 'start()', isCorrect: false },
              { text: 'main()', isCorrect: true },
              { text: 'begin()', isCorrect: false },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'cpp',
    title: 'Lập trình C++',
    language: 'CPP',
    description: 'Lập trình hướng đối tượng và hiệu năng cao trên nền C.',
    order: 4,
    lessons: [
      {
        title: 'Nhập xuất với cin/cout',
        contentMarkdown:
          '# Nhập xuất trong C++\n\nC++ dùng `cout` để xuất và `cin` để nhập.\n\n```cpp\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n```',
        examples: [
          {
            language: 'CPP',
            code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
          },
        ],
        exercises: [
          {
            title: 'In tổng hai số (C++)',
            promptMarkdown: 'Đọc hai số nguyên và in ra tổng của chúng.',
            language: 'CPP',
            starterCode:
              '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    // in ra tổng\n    return 0;\n}',
            testCases: [
              { input: '2 3', expectedOutput: '5', isHidden: false },
              { input: '7 8', expectedOutput: '15', isHidden: true },
            ],
          },
        ],
        questions: [
          {
            text: 'Đối tượng nào dùng để xuất dữ liệu ra màn hình trong C++?',
            type: 'SINGLE',
            choices: [
              { text: 'cin', isCorrect: false },
              { text: 'cout', isCorrect: true },
              { text: 'printf', isCorrect: false },
            ],
          },
        ],
      },
    ],
  },
];

export const badges = [
  { code: 'FIRST_LESSON', title: 'Bước đầu tiên', description: 'Hoàn thành bài học đầu tiên.' },
  { code: 'FIRST_EXERCISE', title: 'Lập trình viên', description: 'Giải đúng bài tập đầu tiên.' },
  {
    code: 'COURSE_COMPLETE',
    title: 'Chinh phục khoá học',
    description: 'Hoàn thành trọn vẹn một khoá học.',
  },
  { code: 'STREAK_7', title: 'Kiên trì 7 ngày', description: 'Học liên tục 7 ngày.' },
];
