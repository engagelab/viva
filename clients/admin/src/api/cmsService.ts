/*
 Copyright 2020 Richard Nesnass and Hoang Bao Ngo
*/

import {
  XHR_REQUEST_TYPE,
  XHRError,
  XHR_CONTENT_TYPE,
  CmsGQLQuery,
} from '../types/main'
import { apiRequest } from './apiRequest'
import {
  cmsUrl,
  cmsClientId,
  cmsClientSecret,
  cmsTokenUrl,
  PROJECT_NAME,
} from '../constants'
import { emitError } from '../utilities'

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

function fetchToken(): Promise<string> {
  return new Promise((resolve) => {
    apiRequest<TokenResponse>({
      route: '',
      method: XHR_REQUEST_TYPE.POST, // or 'PUT'
      credentials: false,
      contentType: XHR_CONTENT_TYPE.URLENCODED,
      body: `grant_type=client_credentials&client_id=${cmsClientId}&client_secret=${cmsClientSecret}&scope=squidex-api`,
      baseURL: `${cmsTokenUrl}`,
    })
      .then((result) => {
        resolve(result.access_token)
      })
      .catch((error) => {
        emitError(new Error('Fetch token error: ' + error.toString()))
      })
  })
}

function cmsRequest(
  projectName: PROJECT_NAME,
  query: string,
  variables: Record<string, string | number>
): Promise<CmsGQLQuery> {
  return new Promise((resolve) => {
    const token = localStorage.getItem('squidex-token')
    // Squidex does not support standard a GraphQL query body!
    // const body = JSON.stringify({ query, variables }),
    Object.keys(variables).forEach((key: string) => {
      const regex = new RegExp(key, 'g')
      const v = variables[key].toString()
      query = query.replace(regex, v)
    })

    const body = { query } // NOTE: MUST use the name 'query' here
    apiRequest<CmsGQLQuery>({
      route: `/api/content/${projectName}/graphql`,
      method: XHR_REQUEST_TYPE.POST,
      credentials: false,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body,
      contentType: XHR_CONTENT_TYPE.JSON,
      baseURL: `${cmsUrl}`,
    })
      .then((res: CmsGQLQuery) => {
        if (res.errors && res.errors.length > 0) {
          emitError(
            new Error(
              'CMS request error: ' +
                res.errors.map((e) => e['message'] + ' : ')
            )
          )
        }
        resolve(res)
      })
      .catch((error: XHRError) => {
        console.log(error)
        if (error.status === 401) {
          console.log('Unauthorized. Attempting to fetch new token ...')
          fetchToken().then((newToken) => {
            localStorage.setItem('squidex-token', newToken)
            resolve(cmsRequest(projectName, query, variables))
          })
        } else emitError(new Error('XHR error: ' + error.toString()))
      })
  })
}
/*
function cmsQuestionByID(
  projectName: string,
  schema: string,
  id: string
): Promise<CmsSingleItemQuery> {
  return new Promise(resolve => {
    const token = localStorage.getItem('squidex-token')
    apiRequest<CmsSingleItemQuery>({
      route: `/api/content/${projectName}/${schemaName}/${id}`,
      method: XHR_REQUEST_TYPE.GET,
      credentials: false,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      contentType: XHR_CONTENT_TYPE.JSON,
      baseURL: `${cmsUrl}`,
    })
      .then((res: CmsSingleItemQuery) => {
        resolve(res)
      })
      .catch((error: XHRError) => {
        console.log(error)
        if (error.status === 401) {
          console.log('Unauthorized. Attempting to fetch new token ...')
          fetchToken().then(newToken => {
            localStorage.setItem('squidex-token', newToken)
            resolve(cmsQuestionByID(projectName, schemaName, id))
          })
        } else console.error('Error: ', error)
      })
  })
} */

export { cmsRequest }
