/* Proxy */
const https = require('https')
const { URL } = require('url')
const { VENDIA_API_URL, VENDIA_API_KEY } = process.env

exports.handler = async (event, context) => {
  const api = new URL(VENDIA_API_URL)
  console.log('api', api)
  // api.searchParams.set('x', 'y')
  const resp = await asyncHttpsRequest(api, {
    method: 'POST',
    headers: {
      'x-api-key': VENDIA_API_KEY
    },
    body: event.body
  })
  console.log('resp', resp)
  return {
    statusCode: 200,
    body: resp
  }
}

async function asyncHttpsRequest(uri, data = {}) {
  return new Promise(function (resolve, reject) {
    const url = (uri instanceof URL) ? uri : resolvePath(uri)
    https.request({
      method: data.method || 'GET',
      host: url.host,
      path: url.pathname + url.search,
      headers: {
        'Accept': 'application/json',
        ...(data.headers) ? data.headers : {}
      },
      ...(data.body) ? { body: data.body } : {}
    }, (resp) => {
      let data = ''
      let responseObj = {
        status: resp.statusCode,
        headers: resp.headers,
        data: null
      }
      resp.on('data', (chunk) => {
        data += chunk
      })
      resp.on('end', () => {
        try {
          responseObj.data = JSON.parse(data)
          if (resp.statusCode >= 200 && resp.statusCode < 300) {
            resolve(responseObj)
          } else {
            reject(responseObj)
          }
        } catch (e) {
          responseObj.data = data
          reject(responseObj)
        }
      })
    })
    .on('error', reject)
    .end()
  })
}

function resolvePath(pathOrUrl) {
  const urlInfo = getHost(pathOrUrl)
  return new URL(urlInfo.path, urlInfo.base)
}

function getHost(url) {
  const data = parseUrl(url)
  let pathName = data.path
  if (!data.protocol && !data.path && url.indexOf('.') > -1) {
    pathName = data.host
  }
  if (!data.protocol && url.indexOf('.') === -1) {
   pathName = url
  }
  return {
    path: pathName,
    base: (!data.protocol) ? VENDIA_API_URL : `${data.protocol}://${data.host}`
  }
}

function parseUrl(url) {
  const match = url.match(/^(https?)?(?:[:/]*)([a-z0-9.-]*)(?::(\d+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/i)
  return {
    protocol: match[1] || '',
    host: match[2] || '',
    port: match[3] || '',
    path: match[4] || '',
    query: match[5] || '',
    fragment: match[6] || '',
  }
}