/*
 Copyright 2018 Richard Nesnass and Sharanya Manivasagam
*/

/*
 *  Note: XMLHttpRequest must be used for cordova apps as Apple's simulator does not support client/server sessions when using Fetch
 */

import constants from '../constants';
import store from '../store/index';
const { baseUrl } = constants;
class ServerService {
  version = '';

  constructor() {
    this.version = '';
  }
  xhrRequest({ method, url, headers, credentials, ct, body }) {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();

      // Event listener must be added before calling open()
      xhr.addEventListener('loadend', () => {
        if (xhr.status != 200) {
          const message = xhr.response ? xhr.response.message : (xhr._context ? (xhr._context.responseText || xhr._context.statusText) : 'Communication error')
          reject(message);
        } else {
          const data = xhr.response;
          resolve(data);
        }
      });

      xhr.open(method, url);
      xhr.responseType = ct === 'application/json' ? 'json' : 'text';
      xhr.withCredentials = credentials;
      const headerKeys = Object.keys(headers);
      headerKeys.forEach(k => xhr.setRequestHeader(k, headers[k]));
      try {
        xhr.send(body);
      } catch (error) {
        reject(error);
      }
    });
  }
  // credentials: true or false
  // params: An object containing key:value pairs representing query parameters
  request({
    route,
    method,
    params,
    body,
    headers,
    credentials,
    contentType,
    mode,
  }) {
    const token = localStorage.getItem('jwt') || '';
    const ct = contentType || 'application/json';
    headers = {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': ct,
      Authorization: `jwt ${token}`,
      ...headers,
    };
    let ps = '';
    const paramKeys = params ? Object.keys(params) : [];
    if (paramKeys.length > 0) {
      ps += '?';
      paramKeys.forEach((key, index) => {
        ps += `${key}=${params[key]}`;
        ps += index < paramKeys.length - 1 ? '&' : '';
      });
    }
    const encodedPs = encodeURI(ps);
    const data = (method !== 'GET' && typeof body === 'object') ? JSON.stringify(body) : body;
    const url = `${baseUrl}${route}${encodedPs}`;
    return this.xhrRequest({
      method,
      url,
      params,
      headers,
      credentials,
      ct,
      body: data ? data : null,
    });
  }
}

export const serverService = new ServerService();
