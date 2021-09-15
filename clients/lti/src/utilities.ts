import { isRef, ref, Ref } from 'vue'
import { User } from './types/main'
import { USER_ROLE, usernameColourMode } from './constants'

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

// Input time as a number - seconds as whole with milliseconds as the decimal e.g. 12.65 = 12 seconds 650 milliseconds
const formatTime = (timeInSeconds: number, offsetTime = 0): string => {
  // Adjust for offset
  const adjustedTimeInSeconds = Math.floor(timeInSeconds - offsetTime)

  let minutes = Math.floor(adjustedTimeInSeconds / 60)
  const hours = Math.floor(minutes / 60)
  // prettier-ignore
  minutes = hours > 0 ? Math.floor(minutes % (60 * hours)) : minutes
  const seconds =
    minutes > 0
      ? Math.floor(adjustedTimeInSeconds % (60 * minutes + 60 * 60 * hours))
      : Math.floor(adjustedTimeInSeconds)
  const minutesString = minutes > 9 ? minutes : '0' + minutes
  const secondsString = seconds > 9 ? seconds : '0' + seconds
  return `${hours > 0 ? hours + ':' : ''}${minutesString}:${secondsString}`
}

// Reverse function to 'formatTime'
// Expects a string in the form '0:00:00' (single hour:mins:seconds)
const formattedTimeToSeconds = (timeString: string): number => {
  const timeArray = timeString.split(':')
  if (timeArray.length === 2) {
    return parseInt(timeArray[0]) * 60 + parseInt(timeArray[1])
  } else if (timeArray.length === 3) {
    return (
      parseInt(timeArray[0]) * 3600 +
      parseInt(timeArray[1]) * 60 +
      parseInt(timeArray[2])
    )
  }
  return -1
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

function getBrightColour(hash: number): string {
  return `hsla(${~~(360 * hash)},70%,70%,1)`
}
function getNormalColour(hash: number): string {
  let colour = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    colour += ('00' + value.toString(16)).substr(-2)
  }
  return colour
}

const stringToColour = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return usernameColourMode === 'bright'
    ? getBrightColour(hash)
    : getNormalColour(hash)
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

export {
  uuid,
  formatDate,
  formatTime,
  formattedTimeToSeconds,
  wrap,
  convertFilePath,
  wait,
  hasMinimumRole,
  shuffleItems,
  emitError,
  stringToColour,
}
