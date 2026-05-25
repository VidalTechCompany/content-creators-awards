export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body.error;
    throw new Error(typeof err === "string" ? err : err ? JSON.stringify(err) : `Request failed (${res.status})`);
  }
  return body as T;
}
