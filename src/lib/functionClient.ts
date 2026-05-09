export class FunctionRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FunctionRequestError";
    this.status = status;
  }
}

type RequestJsonOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
};

export async function requestJson<T = unknown>(url: string, options: RequestJsonOptions = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method || "POST",
      headers: options.headers,
      body: options.body == null ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) throw new FunctionRequestError(data.error || "Request failed", response.status);
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FunctionRequestError("Request timed out. Please try again.", 408);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
