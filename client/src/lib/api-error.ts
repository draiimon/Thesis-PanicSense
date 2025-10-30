/**
 * API Error class for handling HTTP errors
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(response: Response): ApiError {
    return new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }

  static networkError(): ApiError {
    return new ApiError('Network error occurred', 0, 'NETWORK_ERROR');
  }

  static parseError(): ApiError {
    return new ApiError('Failed to parse response', 422, 'PARSE_ERROR');
  }
}
