'use strict';

// Изоляция контекста включена. Здесь при необходимости пробрасываются
// безопасные нативные возможности. Пока фронту достаточно fetch + WebSocket,
// которые в renderer доступны напрямую. Файл оставлен как точка расширения.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  version: process.versions.electron,
});
