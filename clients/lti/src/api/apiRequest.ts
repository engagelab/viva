/*
 Copyright 2018 Richard Nesnass

/*
 *  Note: XMLHttpRequest must be used for cordova apps as Apple's simulator does not support client/server sessions when using Fetch
 */

import { APIRequestPayload, XHRPayload, XHR_CONTENT_TYPE } from '../types/main'
import { baseUrl } from '../constants'

function xhrRequest<T>({
  method,
  url,
  headers,
  credentials,
  body,
}: XHRPayload): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Event listener must be added before calling open()
    xhr.addEventListener('loadend', () => {
      if (xhr.status != 200) {
        reject(xhr.response ? xhr.response : xhr)
      } else {
        resolve(xhr.response)
      }
    })

    xhr.open(method, url)
    xhr.responseType = 'json'
    xhr.withCredentials = credentials
    const headerKeys = Reflect.ownKeys(headers).map((k) => k.toString())
    headerKeys.forEach((k) => xhr.setRequestHeader(k, headers[k]))

    try {
      xhr.send(body)
    } catch (error) {
      reject(error)
    }
  })
}

// credentials: true or false
// params: An object containing key:value pairs representing query parameters
const apiRequest = function <T>({
  route,
  method,
  params,
  body = {}, // Can be FormData, JSON, text, or Object (unknown type). Use contentType to specify which
  headers,
  credentials = true,
  contentType, // Chosen using XHR_CONTENT_TYPE enumerator. Defaults to 'application/json'
  baseURL,
}: APIRequestPayload): Promise<T> {
  // Set token if available
  // const token = localStorage.getItem('jwt') || ''
  const token = ''

  const ct = contentType || XHR_CONTENT_TYPE.JSON
  const _baseUrl = baseURL ? baseURL : baseUrl
  let data

  // Set headers
  headers = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': ct,
    Authorization: `jwt ${token}`,
    ...headers,
  }

  // Encode params and body
  let ps = ''
  const paramKeys = params
    ? Reflect.ownKeys(params).map((k) => k.toString())
    : []
  if (params && paramKeys.length > 0) {
    ps += '?'
    paramKeys.forEach((key, index) => {
      ps += `${key}=${params[key]}`
      ps += index < paramKeys.length - 1 ? '&' : ''
    })
  }
  const encodedPs = encodeURI(ps)

  // Convert body to correct format based on contentType
  if (ct !== XHR_CONTENT_TYPE.MULTIPART) {
    if (typeof body === 'string' && ct === XHR_CONTENT_TYPE.URLENCODED) {
      data = body
    } else {
      data = JSON.stringify(body)
    }
  } else {
    data = body as FormData
    delete headers['Content-Type'] // Adding an explicit content type causes problems with Multer. Allow the browser to set it.
  }

  const url = `${_baseUrl}${route}${encodedPs}`

  // Make the request asynchronously
  return xhrRequest({
    method,
    url,
    headers,
    credentials,
    body: data,
  })
}

export { apiRequest }
