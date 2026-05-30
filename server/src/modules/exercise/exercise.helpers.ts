// Ghi chú ngôn ngữ nào chạy phía client (chỉ để frontend biết). Việc chấm bài
// luôn thực hiện ở server để giữ kín test ẩn và đảm bảo khách quan.
export function runOnClientNote(language: string): boolean {
  return language === 'PYTHON' || language === 'SQL';
}
