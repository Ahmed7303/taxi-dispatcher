'use strict';

// Базовый адрес бэкенда. Меняется в одном месте.
export const BASE_URL = 'https://taxi.achar7303ai.com';

// Токены держим в памяти модуля + дублируем в localStorage,
// чтобы переживать перезапуск окна.
let accessToken = localStorage.getItem('disp_access') || null;
let refreshToken = localStorage.getItem('disp_refresh') || null;

export function getTokens() {
  return { accessToken, refreshToken };
}

export function setTokens(access, refresh) {
  accessToken = access || null;
  refreshToken = refresh || null;
  if (access) localStorage.setItem('disp_access', access);
  else localStorage.removeItem('disp_access');
  if (refresh) localStorage.setItem('disp_refresh', refresh);
  else localStorage.removeItem('disp_refresh');
}

export function clearTokens() {
  setTokens(null, null);
}

// Низкоуровневый запрос без авто-рефреша.
async function raw(method, path, body, withAuth) {
  const headers = { 'Content-Type': 'application/json' };
  if (withAuth && accessToken) headers.Authorization = 'Bearer ' + accessToken;
  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  return { status: res.status, data };
}

// Попытка обновить access по refresh. true — успех.
async function tryRefresh() {
  if (!refreshToken) return false;
  const { status, data } = await raw('POST', '/api/auth/refresh', { refresh_token: refreshToken }, false);
  if (status === 200 && data && data.access_token) {
    setTokens(data.access_token, data.refresh_token || refreshToken);
    return true;
  }
  clearTokens();
  return false;
}

// Запрос с авторизацией и одной попыткой авто-рефреша при 401.
export async function api(method, path, body) {
  let r = await raw(method, path, body, true);
  if (r.status === 401 && refreshToken) {
    const ok = await tryRefresh();
    if (ok) r = await raw(method, path, body, true);
  }
  return r;
}

// Вход диспетчера: логин/пароль -> токены.
export async function dispatcherLogin(login, password) {
  const { status, data } = await raw('POST', '/api/auth/dispatcher/login', { login, password }, false);
  if (status === 200 && data && data.access_token) {
    setTokens(data.access_token, data.refresh_token || null);
    return { ok: true };
  }
  return { ok: false, error: (data && data.message) || 'Неверный логин или пароль' };
}

export async function logout() {
  try { await api('POST', '/api/auth/logout', {}); } catch (e) { /* всё равно чистим */ }
  clearTokens();
}

export function isAuthed() {
  return !!accessToken;
}
