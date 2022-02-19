// ?

import fetch from "./axios";

export function fetchQqMusic(params) {
  return fetch({
    url: "/soso/fcgi-bin/client_search_cp",
    method: "GET",
    params,
  });
}

export function testCnode(params) {
  return fetch({
    url: "/api/v1/topics",
    method: "GET",
    params,
  });
}

export function getNewQqMusic(params) {
  return fetch({
    url: "/splcloud/fcgi-bin/smartbox_new.fcg",
    method: "GET",
    params,
  });
}

export function getKgMusic(params) {
  return fetch({
    url: "/v2/search/song",
    method: "GET",
    params,
  });
}
