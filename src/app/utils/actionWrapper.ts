import { useUiStore } from "../store/useUiStore";
import { getRequiredContext } from "./context";

interface ActionFunction<T> {
  action: (context: { userId: string; roomId: string }) => Promise<T>;
  onSuccess?: () => void;
}

export async function actionWrapper<T>(
  loadingKey: string,
  alterAction: ActionFunction<T>
) {
  const setLoading = useUiStore.getState().setLoading;
  setLoading(loadingKey, true);
  try {
    const context = getRequiredContext();
    const result = await alterAction.action(context);

    if (alterAction.onSuccess) {
      alterAction.onSuccess();
    }
    return result
  } catch (error) {
    console.error(`Action with key '${loadingKey}' failed:`, error);
  } finally {
    setLoading(loadingKey, false);
  }
}
