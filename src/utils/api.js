// ?

import fetch from './axios'

export function fetchQqMusic(params) {
  return fetch({
    url: '/soso/fcgi-bin/client_search_cp',
    method: 'GET',
    params
  })
}
<<<<<<< HEAD
=======

export function testCnode(params){
  return fetch({
    url:'/api/v1/topics',
    method:'GET',
    params
  })
}
>>>>>>> liuyahuaTest02
