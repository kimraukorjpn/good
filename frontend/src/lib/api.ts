export type CurrentUser = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  profile_completed: boolean;
  grade: 1 | 2 | 3 | null;
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`/backend-api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fallbackMessage = response.status >= 500
      ? "서버 연결이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
      : "요청을 처리하지 못했습니다.";
    throw new ApiError(data.detail ?? fallbackMessage, response.status);
  }
  return data as T;
}