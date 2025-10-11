export type ValidationError = {
  path: string;
  message: string;
  field?: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
};

export function createSuccessResponse<T>(message: string, data: T): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function createErrorResponse(
  message: string,
  errors?: ValidationError[]
): ApiResponse<never> {
  return {
    success: false,
    message,
    errors,
  };
}
