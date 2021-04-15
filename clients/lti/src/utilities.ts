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
const dateToFormattedString = (date: Date): string => {
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
      return user.role === USER_ROLE.monitor || user.role === USER_ROLE.admin
        ? true
        : false
    case USER_ROLE.admin:
      return user.role === USER_ROLE.admin ? true : false
    default:
      return false
  }
}

const emitError = (error: Error): void => {
  const e = new CustomEvent<Error>('vivaerror', {
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

enum WINDOW_SIZES {
  OLD_HEIGHT = 768,
  OLD_WIDTH = 1024,
  /*  NEW_HEIGHT = window.innerHeight,
  NEW_WIDTH = window.innerWidth, */
  NEW_HEIGHT = 768,
  NEW_WIDTH = 1024,
  SCALE = Math.min(NEW_WIDTH / OLD_WIDTH, NEW_HEIGHT / OLD_HEIGHT),
  SCALE_Y = NEW_HEIGHT / OLD_HEIGHT,
  SCALE_X = NEW_WIDTH / OLD_WIDTH,
}

const scaleContent = (): number => {
  return Math.min(
    WINDOW_SIZES.NEW_WIDTH / WINDOW_SIZES.OLD_WIDTH,
    WINDOW_SIZES.NEW_HEIGHT / WINDOW_SIZES.OLD_HEIGHT
  )
}

interface Coordinates {
  h: number
  w: number
  x: number
  y: number
}
const getCoordinates = (coordinates: Coordinates): Coordinates => {
  const scaledCoordinates = {
    h: coordinates.h * WINDOW_SIZES.SCALE_Y,
    w: coordinates.w * WINDOW_SIZES.SCALE_X,
    x: coordinates.x * WINDOW_SIZES.SCALE_X,
    y: coordinates.y * WINDOW_SIZES.SCALE_Y,
  }
  return scaledCoordinates
}

export {
  uuid,
  dateToFormattedString,
  wrap,
  convertFilePath,
  wait,
  hasMinimumRole,
  shuffleItems,
  emitError,
  getCoordinates,
  scaleContent,
  WINDOW_SIZES,
}
