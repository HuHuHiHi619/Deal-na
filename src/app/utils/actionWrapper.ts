import { useUiStore } from "../store/useUiStore";
import { getRequiredContext } from "./context";

interface ActionFunction<T> {
  action: (context: { userId: string; roomId: string }) => Promise<T>;
  onSuccess?: (data : T) => void;
  onError? : (error : unknown) => void
}

export async function actionWrapper<T>(
  key: string,
  alterAction: ActionFunction<T>
) {
  const ui = useUiStore.getState()
  ui.setLoading(key, true);
  ui.setError(key, null);
  
  try {
    const context = getRequiredContext();
    const result = await alterAction.action(context);

    if (alterAction.onSuccess) {
      alterAction.onSuccess(result);
    }
    return result
  } catch (error) {
    console.error(`Action with key '${key}' failed:`, error);
    const message = error instanceof Error ? error.message : "Something went wrong"
    ui.setError(key , message)
    alterAction.onError?.(error)
  } finally {
    ui.setLoading(key, false)
  }
}
