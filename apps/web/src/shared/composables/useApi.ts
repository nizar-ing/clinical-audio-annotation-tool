import { ref } from 'vue';
import type { Ref } from 'vue';

export interface ApiListResponse<T> {
  data: T[];
  meta: { total: number };
}

export interface ApiResponse<T> {
  data: T;
}

export function useApi() {
  const loading = ref(false);
  const error: Ref<string | null> = ref(null);

  async function get<T>(url: string, params?: Record<string, string | number | boolean>): Promise<T> {
    loading.value = true;
    error.value = null;
    try {
      const fullUrl = params ? `${url}?${new URLSearchParams(toStringRecord(params)).toString()}` : url;
      const res = await fetch(fullUrl);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? `HTTP ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function patch<T>(url: string, body: unknown): Promise<T> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(payload.error?.message ?? `HTTP ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, get, patch };
}

function toStringRecord(params: Record<string, string | number | boolean>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  );
}
