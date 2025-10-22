// utils/actionHelper.js

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
  const { setError, setLoading } = ui;
  setLoading(key, true);
  setError(key, null);

  try {
    const result = await action();
    options?.onSuccess?.(result);
    return result;
  } catch (error) {
    console.log(`Action ${key} error: ${error}`);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    setError(key, message);
    options?.onError?.(error);
    throw error;
  } finally {
    setLoading(key, false);
  }
}

// แก้ปัญหา asyncAction
