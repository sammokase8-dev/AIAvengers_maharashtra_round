import { ApiError } from '../types';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
const TOKEN_KEY = 'creatorai_auth_token';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore in environments without localStorage
    }
  }

  public removeToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    unwrapData = true
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: {
          message?: string;
          code?: string;
          details?: Record<string, unknown>;
          error?: {
            message?: string;
            code?: string;
            details?: Record<string, unknown>;
          };
        } = {};
        try {
          errorData = (await response.json()) as typeof errorData;
        } catch {
          errorData = { message: response.statusText || 'An unexpected API error occurred' };
        }

        const apiErrorBody = errorData.error || errorData;
        const apiError: ApiError = {
          status: response.status,
          message: apiErrorBody.message || `Request failed with status ${response.status}`,
          code: apiErrorBody.code,
          details: apiErrorBody.details,
        };

        if (response.status === 401) {
          // Token expired or invalid
          this.removeToken();
          window.dispatchEvent(new CustomEvent('creatorai:unauthorized'));
        }

        throw apiError;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      const responseData = (await response.json()) as unknown;
      if (
        unwrapData &&
        responseData !== null &&
        typeof responseData === 'object' &&
        'success' in responseData &&
        responseData.success === false
      ) {
        const errorEnvelope = responseData as {
          error?: { code?: string; message?: string; details?: Record<string, unknown> };
        };
        throw {
          status: response.status,
          message: errorEnvelope.error?.message || 'The API reported an unsuccessful response',
          code: errorEnvelope.error?.code || 'API_ERROR',
          details: errorEnvelope.error?.details,
        } satisfies ApiError;
      }
      if (
        unwrapData &&
        responseData !== null &&
        typeof responseData === 'object' &&
        'success' in responseData &&
        responseData.success === true &&
        'data' in responseData
      ) {
        return responseData.data as T;
      }
      return responseData as T;
    } catch (err: any) {
      if (err.status && err.message) {
        throw err;
      }

      // Network failure or backend not responding
      const networkError: ApiError = {
        status: 0,
        message:
          err.name === 'AbortError'
            ? 'Request was cancelled'
            : `Cannot connect to CreatorAI backend at ${this.baseUrl}. Check network or start backend server.`,
        code: 'NETWORK_ERROR',
      };
      throw networkError;
    }
  }

  public async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let queryString = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) queryString = `?${qs}`;
    }
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async postRaw<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      false
    );
  }

  public async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Send a multipart file upload without overriding the browser-generated boundary.
  public async uploadFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
