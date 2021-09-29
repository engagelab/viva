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
import { isRef, ref, Ref } from 'vue'
import { User } from './types/main'
import { USER_ROLE } from './constants'

const wrap = <T>(element: Ref<T> | T): Ref<T> => {
  if (isRef(element)) {
    return element
  }
  return ref(element) as Ref<T>
}

const convertFilePath = (path: string): string => {
  return window.WkWebView.convertFilePath(path)
}

// Return a new array that is a shuffled version of the supplied array
const shuffleItems = <T>(itemsArray: Array<T>): Array<T> => {
  const indexArray = itemsArray.map((item, index: number) => index)
  let currentIndex = indexArray.length,
    temporaryValue,
    randomIndex

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1
    // And swap it with the current element.
    temporaryValue = indexArray[currentIndex]
    indexArray[currentIndex] = indexArray[randomIndex]
    indexArray[randomIndex] = temporaryValue
  }
  return indexArray.map((index) => itemsArray[index])
}

// https://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date
const formatDate = (date: Date): string => {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const day = date.getDate()
  const monthIndex = date.getMonth()
  const year = date.getFullYear()

  let hours = date.getHours().toString()
  let mins = date.getMinutes().toString()

  hours = hours.length == 1 ? '0' + hours : hours
  mins = mins.length == 1 ? '0' + mins : mins

  return (
    day + ' ' + monthNames[monthIndex] + ' ' + year + ' | ' + hours + ':' + mins
  )
}

// Random UUID. See https://gist.github.com/jed/982883
const uuid = (a = ''): string =>
  a
    ? /* eslint-disable no-bitwise */
      ((Number(a) ^ (Math.random() * 16)) >> (Number(a) / 4)).toString(16)
    : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, uuid)

const hasMinimumRole = (user: User, requestedRole: USER_ROLE): boolean => {
  if (!user) return false
  switch (requestedRole) {
    case USER_ROLE.user:
      return true
    case USER_ROLE.monitor:
      return user.status.role === USER_ROLE.monitor ||
        user.status.role === USER_ROLE.admin
        ? true
        : false
    case USER_ROLE.admin:
      return user.status.role === USER_ROLE.admin ? true : false
    default:
      return false
  }
}

const emitError = (error: Error): void => {
  const e = new CustomEvent<Error>('slpluserror', {
    detail: error,
  })
  window.dispatchEvent(e)
}

// Async: Wait a number of milliseconds before resolving
const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

/*
  Taken from: https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
/* function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint16Array(buf))
}

function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length * 2) // 2 bytes for each char
  const bufView = new Uint16Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

function ui8arr2str(uint8array: Uint8Array): string {
  return uint8array.toString()
}

function str2ui8arr(myString: string): Uint8Array {
  const array = myString.split(',').map((s) => Number.parseInt(s))
  return Uint8Array.from(array)
} */

export {
  uuid,
  formatDate,
  wrap,
  convertFilePath,
  wait,
  hasMinimumRole,
  shuffleItems,
  emitError,
  /* ab2str,
  str2ab,
  ui8arr2str,
  str2ui8arr, */
}
