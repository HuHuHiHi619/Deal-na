// utils/actionHelper.ts
export async function executeWithUI<T>(
  key: string,
  action: () => Promise<T>,
  ui: {
    setLoading: (key: string, value: boolean) => void;
    setError: (key: string, message: string | null) => void;
  },
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
  }
): Promise<T | undefined> {
  const { setLoading, setError } = ui;

  setLoading(key, true);
  setError(key, null); // reset error ก่อนเริ่ม action

  try {
    const result = await action();
    options?.onSuccess?.(result);
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    console.error(`[executeWithUI] ${key} failed:`, message);
    setError(key, message);

    // แค่ log/handle — ไม่โยนต่อ เพื่อไม่ให้ React กลืน error
    options?.onError?.(error);

    return undefined; // ✅ ไม่ throw ออกมา
  } finally {
    setLoading(key, false);
  }
}
