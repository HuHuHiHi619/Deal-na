import { useUiStore } from "../store/useUiStore"

export function useAsyncAction<T>(
    actionKey : string,
    options : {
        showErrorInUI? : boolean,
        errorTimeout? : number,
        onSuccess? : (data : T) => void,
        onError? : (error : unknown) => void
    } = {}
) {
    const ui = useUiStore()
    const isLoading = ui.isLoading(actionKey)
    const error = ui.getError(actionKey)
    
    const execute = async (action : () => Promise<T>) => {
        ui.setLoading(actionKey , true)
        ui.setError(actionKey , null)

        try{
            const result = await action()
            options?.onSuccess?.(result)
            return result
        }catch(error){
          console.error(error)
          const message  = 
            error instanceof Error ? error.message : "Something went wrong"
          ui.setError(actionKey , message)
        } finally {
            ui.setLoading(actionKey, false)
        }
    }
    return { execute , isLoading , error }


}