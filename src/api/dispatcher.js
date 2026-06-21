'use strict';

import { api } from './client';

// Снимок: текущие заказы + все водители
export async function fetchOverview() {
  const { status, data } = await api('GET', '/api/dispatchers/overview');
  if (status === 200 && data) {
    return { ok: true, orders: data.orders || [], drivers: data.drivers || [] };
  }
  return { ok: false, error: 'Не удалось загрузить (' + status + ')' };
}

// Пополнение/списание токенов водителю. amount — ненулевое целое (минус = списание).
export async function topupTokens(driverId, amount, reason) {
  const { status, data } = await api('POST', `/api/dispatchers/drivers/${driverId}/tokens`,
    { amount, reason });
  if (status === 200 && data && data.ok) return { ok: true, balance: data.balance };
  return { ok: false, error: (data && data.message) || 'Ошибка (' + status + ')' };
}

// Разморозка водителя
export async function unfreezeDriver(driverId) {
  const { status, data } = await api('POST', `/api/dispatchers/drivers/${driverId}/unfreeze`, {});
  if (status === 200 && data && data.ok) return { ok: true };
  return { ok: false, error: (data && data.message) || 'Ошибка (' + status + ')' };
}

// Разблокировка клиента
export async function unblockClient(clientId) {
  const { status, data } = await api('POST', `/api/dispatchers/clients/${clientId}/unblock`, {});
  if (status === 200 && data && data.ok) return { ok: true };
  return { ok: false, error: (data && data.message) || 'Ошибка (' + status + ')' };
}
