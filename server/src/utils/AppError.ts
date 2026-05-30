// Lớp lỗi ứng dụng có mã HTTP và mã lỗi nghiệp vụ.
// Dùng để middleware xử lý lỗi chuẩn hoá phản hồi.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Bạn cần đăng nhập để thực hiện thao tác này.') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Bạn không có quyền truy cập tài nguyên này.') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Không tìm thấy tài nguyên.') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static tooManyRequests(message = 'Bạn thao tác quá nhanh, vui lòng thử lại sau.') {
    return new AppError(429, 'TOO_MANY_REQUESTS', message);
  }

  static badGateway(message = 'Dịch vụ bên ngoài đang gặp sự cố.') {
    return new AppError(502, 'BAD_GATEWAY', message);
  }

  static internal(message = 'Đã xảy ra lỗi máy chủ.') {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }
}
