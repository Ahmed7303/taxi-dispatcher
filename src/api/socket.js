'use strict';

import { io } from 'socket.io-client';
import { BASE_URL, getTokens } from './client';

let socket = null;

// Подключение к реальному времени с JWT диспетчера.
// onEvent(name, payload) вызывается на каждое событие пульта.
export function connectSocket(onStatus, onOverview) {
  const { accessToken } = getTokens();
  if (!accessToken) return null;
  if (socket) { socket.disconnect(); socket = null; }

  socket = io(BASE_URL, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
  });

  socket.on('connect', () => onStatus && onStatus('connected'));
  socket.on('disconnect', () => onStatus && onStatus('disconnected'));
  socket.on('connect_error', () => onStatus && onStatus('error'));

  // Диспетчер состоит в комнате dispatchers и получает overview:update
  socket.on('overview:update', (payload) => onOverview && onOverview(payload));

  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

export function getSocket() {
  return socket;
}
