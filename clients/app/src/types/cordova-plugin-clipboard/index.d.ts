interface Clipboard {
  copy(text: string, onSuccess: () => void, onFail: () => void): void
  paste(onSuccess: () => void, onFail: () => void): void
  clear(onSuccess: () => void, onFail: () => void): void
}

interface CordovaPlugins {
  clipboard: Clipboard
}
