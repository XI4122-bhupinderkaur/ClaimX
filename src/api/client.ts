import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

declare const process: {
  env?: Record<string, string | undefined>;
};

type ApiErrorShape = {
  message?: string;
  errors?: Record<string, string[]>;
};

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
}

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, string[]>;

  constructor(
    message: string,
    status?: number,
    code?: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

const resolveBaseUrl = (): string | undefined => {
  const baseUrl =
    process.env?.CLAIMX_API_BASE_URL ??
    process.env?.EXPO_PUBLIC_API_BASE_URL ??
    process.env?.API_BASE_URL;

  return baseUrl && baseUrl.trim().length > 0 ? baseUrl.trim() : undefined;
};

const isAxiosError = (error: unknown): error is AxiosError<ApiErrorShape> =>
  axios.isAxiosError(error);

const normalizeError = (error: unknown): ApiError => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorShape | undefined;
    const message =
      payload?.message ?? error.message ?? 'Request failed';
    const details = payload?.errors;

    return new ApiError(
      message,
      error.response?.status,
      error.code,
      details,
    );
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('Request failed');
};

export const createApiClient = (
  config: ApiClientConfig = {},
): AxiosInstance => {
  const client = axios.create({
    baseURL: config.baseURL ?? resolveBaseUrl(),
    timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((request: InternalAxiosRequestConfig) => {
    if (request.headers) {
      request.headers.Accept = 'application/json';
      request.headers['Content-Type'] = 'application/json';
    }

    return request;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => Promise.reject(normalizeError(error)),
  );

  return client;
};

export const apiClient = createApiClient();

export const setApiBaseUrl = (baseURL: string): void => {
  apiClient.defaults.baseURL = baseURL;
};

export const setApiTimeout = (timeoutMs: number): void => {
  apiClient.defaults.timeout = timeoutMs;
};

export const getApiBaseUrl = (): string | undefined => apiClient.defaults.baseURL;
