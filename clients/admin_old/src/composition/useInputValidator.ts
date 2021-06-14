import { ref, Ref, watch } from 'vue'

const minLength = (min: number): ((input: string) => string) => {
  return (input: string): string =>
    input.length < min ? `Value must be at least ${min} characters` : ''
}

const isEmail = (): ((input: string) => string) => {
  const re = /\S+@\S+\.\S+/
  return (input: string): string =>
    re.test(input) ? '' : 'Must be a valid email address'
}

const validate = (
  startVal: string,
  validators: Array<(input: string) => string>,
  onValidate: (value: string) => void
): Record<string, Ref> => {
  const input = ref(startVal)
  const errors = ref<string[]>([])
  watch(input, (value) => {
    errors.value = validators.map((v: (input: string) => string) => v(value))
    onValidate(value)
  })
  return {
    input,
    errors,
  }
}

export { minLength, isEmail, validate }
