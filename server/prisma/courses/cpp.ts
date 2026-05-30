import type { SeedCourse } from '../seedData.js';

export const cppCourse: SeedCourse = {
  slug: 'cpp',
  title: 'Lập trình C++',
  language: 'CPP',
  description: 'Lập trình hướng đối tượng và hiệu năng cao: nhập xuất cin/cout, biến, vòng lặp.',
  order: 4,
  lessons: [
    {
      title: 'Nhập xuất với cin/cout',
      contentMarkdown: `# Chương trình C++ đầu tiên

C++ dùng \`cout\` để xuất và \`cin\` để nhập, qua thư viện \`<iostream>\`.

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
\`\`\`

## Giải thích

- \`#include <iostream>\`: thư viện nhập/xuất
- \`cout <<\`: in ra màn hình
- \`endl\`: xuống dòng
- \`using namespace std;\`: dùng để khỏi viết \`std::\` mỗi lần

> Toán tử \`<<\` ("đẩy ra") dùng với \`cout\`, còn \`>>\` ("đọc vào") dùng với \`cin\`.`,
      examples: [
        { language: 'CPP', code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
      ],
      exercises: [
        {
          title: 'In tổng hai số (C++)',
          promptMarkdown: 'Đọc hai số nguyên và in ra tổng của chúng.',
          language: 'CPP',
          starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    // in ra tổng\n    return 0;\n}',
          testCases: [
            { input: '2 3', expectedOutput: '5', isHidden: false },
            { input: '7 8', expectedOutput: '15', isHidden: true },
            { input: '100 23', expectedOutput: '123', isHidden: true },
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
    {
      title: 'Biến và vòng lặp',
      contentMarkdown: `# Biến và vòng lặp trong C++

## Khai báo biến

\`\`\`cpp
int tuoi = 20;
double diem = 8.5;
string ten = "An";   // cần #include <string>
\`\`\`

## Vòng lặp for

\`\`\`cpp
for (int i = 1; i <= 5; i++) {
    cout << i << " ";
}
\`\`\`

## Vòng lặp while

\`\`\`cpp
int i = 0;
while (i < 3) {
    cout << i << endl;
    i++;
}
\`\`\`

> Cú pháp vòng lặp \`for\` của C++ gồm 3 phần: khởi tạo; điều kiện; cập nhật.`,
      examples: [
        { language: 'CPP', code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int tong = 0;\n    for (int i = 1; i <= 5; i++) tong += i;\n    cout << "Tong 1..5 = " << tong << endl;\n    return 0;\n}' },
      ],
      exercises: [
        {
          title: 'Tổng từ 1 đến N',
          promptMarkdown: 'Đọc số nguyên dương `N`. In ra tổng các số từ 1 đến N.',
          language: 'CPP',
          starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // tính tổng 1..n\n    return 0;\n}',
          testCases: [
            { input: '5', expectedOutput: '15', isHidden: false },
            { input: '100', expectedOutput: '5050', isHidden: true },
            { input: '1', expectedOutput: '1', isHidden: true },
          ],
        },
      ],
      questions: [
        {
          text: 'Vòng lặp for trong C++ gồm mấy phần trong dấu ngoặc?',
          type: 'SINGLE',
          choices: [
            { text: '2 phần', isCorrect: false },
            { text: '3 phần (khởi tạo; điều kiện; cập nhật)', isCorrect: true },
            { text: '4 phần', isCorrect: false },
          ],
        },
      ],
    },
  ],
};
