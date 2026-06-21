'use strict';

import React from 'react';
import { useStore } from '../store/useStore';
import { logout } from '../api/client';
import OrdersScreen from '../screens/OrdersScreen';

const NAV = [
  { id: 'orders', label: 'Заказы' },
  { id: 'drivers', label: 'Водители' },
  { id: 'vip', label: 'ВИП-заявки' },
  { id: 'disputes', label: 'Споры' },
  { id: 'clients', label: 'Клиенты' },
];

function StatusDot({ status }) {
  const map = {
    connected: { c: 'var(--green)', t: 'на связи' },
    disconnected: { c: 'var(--yellow)', t: 'переподключение…' },
    error: { c: 'var(--red)', t: 'ошибка связи' },
    idle: { c: 'var(--text-dim)', t: '—' },
  };
  const s = map[status] || map.idle;
  return (
    <div className="row" style={{ gap: 7 }}>
      <span style={{ width: 9, height: 9, borderRadius: 9, background: s.c, display: 'inline-block' }} />
      <span className="dim" style={{ fontSize: 12 }}>{s.t}</span>
    </div>
  );
}

export default function Shell() {
  const screen = useStore((s) => s.screen);
  const setScreen = useStore((s) => s.setScreen);
  const socketStatus = useStore((s) => s.socketStatus);
  const setAuthed = useStore((s) => s.setAuthed);

  async function onLogout() {
    await logout();
    setAuthed(false);
  }

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      <aside style={side}>
        <div style={{ padding: '18px 18px 14px', fontWeight: 700, fontSize: 16 }}>
          Такси Диспетчер
        </div>
        <nav style={{ flex: 1, padding: '6px 10px' }}>
          {NAV.map((n) => (
            <div key={n.id}
              onClick={() => setScreen(n.id)}
              style={{ ...navItem, ...(screen === n.id ? navItemActive : {}) }}>
              {n.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
          <StatusDot status={socketStatus} />
          <button className="ghost" style={{ marginTop: 12, width: '100%' }} onClick={onLogout}>
            Выйти
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {screen === 'orders' && <OrdersScreen />}
        {screen !== 'orders' && <Placeholder name={NAV.find((n) => n.id === screen)?.label} />}
      </main>
    </div>
  );
}

function Placeholder({ name }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="dim">Экран «{name}» — добавим следующим шагом</div>
    </div>
  );
}

const side = {
  width: 220, background: 'var(--bg-elev)', borderRight: '1px solid var(--border)',
  display: 'flex', flexDirection: 'column',
};
const navItem = {
  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', color: 'var(--text-dim)',
  marginBottom: 2,
};
const navItemActive = { background: 'var(--bg-elev2)', color: 'var(--text)' };
