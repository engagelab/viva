import { ref, Ref, computed, ComputedRef } from 'vue'
import router from '../router'

interface Dialog {
  visible: boolean
  data: Record<string, unknown>
  doneCallback: (d: boolean) => void
}
interface Snackbar {
  type: string
  visibility: boolean // A toggle for showing error messages to the user
  text: string
  callback?: () => void
}
export interface NotifyState {
  dialog: Dialog
  snackbar: Snackbar
}
const _notifyState: Ref<NotifyState> = ref({
  dialog: {
    visible: false,
    data: {}, // Data object to pass to the child dialog
    doneCallback: () => ({}), // Callback function from the originating component
  },
  snackbar: {
    visibility: false, // A toggle for showing error messages to the user
    type: 'none',
    text: '',
  },
})

interface Getters {
  dialog: ComputedRef<Dialog>
  snackbar: ComputedRef<Snackbar>
}
const getters = {
  get dialog(): ComputedRef<Dialog> {
    return computed(() => _notifyState.value.dialog)
  },
  get snackbar(): ComputedRef<Snackbar> {
    return computed(() => _notifyState.value.snackbar)
  },
}
interface Actions {
  setDialog: (dialog: Dialog) => void
  setSnackbar: (newSnackbar: Snackbar) => void
  errorMessage: (message: Error | string) => void
}
const actions = {
  setDialog(dialog: Dialog): void {
    _notifyState.value.dialog = dialog
  },
  setSnackbar(newSnackbar: Snackbar): void {
    _notifyState.value.snackbar = newSnackbar
  },
  errorMessage(error: Error | string): void {
    let errorMessage = ''
    if (typeof error === 'string') errorMessage = error
    else errorMessage = error.message
    console.log(`Error: ${errorMessage}`)
    if (errorMessage == 'Invalid login') {
      router.push('/logout')
      window.setTimeout(() => {
        this.setSnackbar({
          visibility: true,
          text: errorMessage + '. Vennligst logg inn igjen',
          type: 'error',
          callback: undefined,
        })
      }, 2000)
    }
    this.setSnackbar({
      visibility: true,
      text: errorMessage,
      type: 'error',
      callback: undefined,
    })
  },
}

interface ServiceInterface {
  actions: Actions
  getters: Getters
}
export function useNotifyStore(): ServiceInterface {
  return {
    getters,
    actions,
  }
}

export type NotifyStoreType = ReturnType<typeof useNotifyStore>
