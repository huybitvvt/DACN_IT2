import type { SeedCourse } from '../seedData.js';

export const cCourse: SeedCourse = {
  slug: 'c',
  title: 'Lập trình C',
  language: 'C',
  description: 'Ngôn ngữ nền tảng: cấu trúc chương trình, biến, nhập xuất, điều kiện và vòng lặp.',
  order: 3,
  lessons: [
    {
      title: 'Chương trình C đầu tiên',
      contentMarkdown: `# Cấu trúc chương trình C

Mọi chương trình C bắt đầu thực thi từ hàm \`main()\`. Thư viện \`stdio.h\` cung cấp hàm nhập/xuất.

\`\`\`c
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
\`\`\`

## Giải thích

| Dòng | Ý nghĩa |
|------|---------|
| \`#include <stdio.h>\` | Khai báo thư viện nhập/xuất |
| \`int main()\` | Hàm chính, điểm bắt đầu |
| \`printf(...)\` | In ra màn hình |
| \`return 0;\` | Báo chương trình kết thúc bình thường |

> Ký tự \`\\n\` là xuống dòng. Mỗi câu lệnh kết thúc bằng dấu chấm phẩy \`;\`.`,
      examples: [
        { language: 'C', code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}' },
      ],
      exercises: [
        {
          title: 'In tổng hai số (C)',
          promptMarkdown: 'Đọc hai số nguyên (cách nhau dấu cách) và in ra tổng.',
          language: 'C',
          starterCode: '#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    // in ra tổng\n    return 0;\n}',
          testCases: [
            { input: '2 3', expectedOutput: '5', isHidden: false },
            { input: '100 200', expectedOutput: '300', isHidden: true },
            { input: '-5 5', expectedOutput: '0', isHidden: true },
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
    {
      title: 'Biến và nhập xuất',
      contentMarkdown: `# Biến trong C

Khác Python, C **phải khai báo kiểu** trước khi dùng biến.

\`\`\`c
int tuoi = 20;
float diem = 8.5;
char ky_tu = 'A';
\`\`\`

## Định dạng nhập/xuất

| Kiểu | Định dạng | Dùng với |
|------|-----------|----------|
| \`int\` | \`%d\` | số nguyên |
| \`float\` | \`%f\` | số thực |
| \`char\` | \`%c\` | ký tự |

\`\`\`c
int n;
scanf("%d", &n);       // đọc số nguyên
printf("Ban nhap: %d\\n", n);
\`\`\`

> Nhớ dấu \`&\` trước biến khi dùng \`scanf\`.`,
      examples: [
        { language: 'C', code: '#include <stdio.h>\n\nint main() {\n    int a = 7, b = 3;\n    printf("Tong = %d\\n", a + b);\n    return 0;\n}' },
      ],
      exercises: [
        {
          title: 'Diện tích hình chữ nhật',
          promptMarkdown: 'Đọc chiều dài và chiều rộng (số nguyên, cách nhau dấu cách). In ra diện tích.',
          language: 'C',
          starterCode: '#include <stdio.h>\n\nint main() {\n    int d, r;\n    scanf("%d %d", &d, &r);\n    // in diện tích\n    return 0;\n}',
          testCases: [
            { input: '4 5', expectedOutput: '20', isHidden: false },
            { input: '10 10', expectedOutput: '100', isHidden: true },
          ],
        },
      ],
      questions: [
        {
          text: 'Định dạng nào dùng để in số nguyên trong printf?',
          type: 'SINGLE',
          choices: [
            { text: '%d', isCorrect: true },
            { text: '%f', isCorrect: false },
            { text: '%s', isCorrect: false },
          ],
        },
      ],
    },
  ],
};
