'use strict';

import { create } from 'zustand';
import { isAuthed } from '../api/client';

export const useStore = create((set) => ({
  // авторизация
  authed: isAuthed(),
  setAuthed: (v) => set({ authed: v }),

  // статус соединения реального времени: connected | disconnected | error | idle
  socketStatus: 'idle',
  setSocketStatus: (s) => set({ socketStatus: s }),

  // лента событий пульта (overview:update), новые сверху, держим последние 200
  events: [],
  pushEvent: (e) =>
    set((st) => ({ events: [{ ...e, at: Date.now() }, ...st.events].slice(0, 200) })),
  clearEvents: () => set({ events: [] }),

  // активный экран
  screen: 'orders',
  setScreen: (s) => set({ screen: s }),
}));
