// ?

import fetch from './axios'

export function fetchQqMusic(params) {
  return fetch({
    url: '/soso/fcgi-bin/client_search_cp',
    method: 'GET',
    params
  })
}

export function testCnode(params){
  return fetch({
    url:'/api/v1/topics',
    method:'GET',
    params
  })
}
