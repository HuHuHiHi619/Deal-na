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
  setError(key, null); 

  try {
    const result = await action();
    options?.onSuccess?.(result);
    return result;
  } catch (error : unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    console.error(`[executeWithUI] ${key} failed:`, message);
    setError(key, message);

    options?.onError?.(error);

    return undefined; 
  } finally {
    setLoading(key, false);
  }
}
