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
      if (xhr.status > 299) {
        reject(new Error(xhr.response ? xhr.response.error : xhr.statusText))
      } else {
        resolve(xhr.response)
      }
    })

    xhr.addEventListener('error', (error) => {
      reject(error)
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
// query: An object containing key:value pairs representing query parameters
const apiRequest = function <T>({
  route,
  method,
  query,
  body = {}, // Can be FormData, JSON, text, or Object (unknown type). Use contentType to specify which
  headers,
  credentials = true,
  contentType, // Chosen using XHR_CONTENT_TYPE enumerator. Defaults to 'application/json'
  baseURL,
}: APIRequestPayload): Promise<T> {
  // Set token if available
  const token = localStorage.getItem('jwt') || ''

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

  // Encode query and body
  let qs = ''
  const queryKeys = query ? Reflect.ownKeys(query).map((k) => k.toString()) : []
  if (query && queryKeys.length > 0) {
    qs += '?'
    queryKeys.forEach((key, index) => {
      qs += `${key}=${query[key]}`
      qs += index < queryKeys.length - 1 ? '&' : ''
    })
  }
  const encodedQs = encodeURI(qs)

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

  const url = `${_baseUrl}${route}${encodedQs}`

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
