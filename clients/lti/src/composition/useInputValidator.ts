/*
 Copyright 2020, 2021 Richard Nesnass, Sharanya Manivasagam, and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see <http://www.gnu.org/licenses/>.
 */

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
