export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? undefined);
  if (init?.body != null && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body.error;
    throw new Error(typeof err === "string" ? err : err ? JSON.stringify(err) : `Request failed (${res.status})`);
  }
  return body as T;
}
