'use strict';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import { useStore } from '../store/useStore';

// Человекочитаемые подписи причин событий overview:update
const REASON_RU = {
  order_offered: 'Предложен водителям',
  accepted: 'Принят',
  arrived: 'Водитель прибыл',
  in_progress: 'Поездка началась',
  completed: 'Завершён',
  cancelled: 'Отменён',
  no_show: 'Неявка',
  no_drivers: 'Нет водителей',
  driver_status: 'Статус водителя',
};

function reasonColor(reason) {
  if (reason === 'completed' || reason === 'accepted') return 'var(--green)';
  if (reason === 'cancelled' || reason === 'no_show' || reason === 'no_drivers') return 'var(--red)';
  if (reason === 'arrived' || reason === 'in_progress') return 'var(--yellow)';
  return 'var(--accent)';
}

function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function OrdersScreen() {
  const events = useStore((s) => s.events);
  const clearEvents = useStore((s) => s.clearEvents);
  const [snapshot, setSnapshot] = useState({ loading: true, rows: [], error: null });

  const loadSnapshot = useCallback(async () => {
    setSnapshot((p) => ({ ...p, loading: true, error: null }));
    const { status, data } = await api('GET', '/api/dispatchers/overview');
    if (status === 200 && data) {
      // защищаемся от разной формы ответа: ищем массив заказов
      const rows = Array.isArray(data) ? data
        : Array.isArray(data.orders) ? data.orders
        : Array.isArray(data.items) ? data.items
        : [];
      setSnapshot({ loading: false, rows, error: null });
    } else {
      setSnapshot({ loading: false, rows: [], error: 'Не удалось загрузить (' + status + ')' });
    }
  }, []);

  useEffect(() => { loadSnapshot(); }, [loadSnapshot]);

  // живое обновление снимка: на любое событие пульта перезагружаем список заказов
  // (со схлопыванием частых событий, чтобы не дёргать сервер на каждое)
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    let timer = null;
    const onOverview = () => {
      if (timer) return;
      timer = setTimeout(() => { timer = null; loadSnapshot(); }, 400);
    };
    s.on('overview:update', onOverview);
    return () => { s.off('overview:update', onOverview); if (timer) clearTimeout(timer); };
  }, [loadSnapshot]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={head}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Заказы</div>
        <div className="spacer" />
        <button onClick={loadSnapshot}>Обновить снимок</button>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Снимок текущих заказов */}
        <section style={{ flex: 1.4, overflow: 'auto', padding: 16, borderRight: '1px solid var(--border)' }}>
          <div className="dim" style={secTitle}>Текущие заказы</div>
          {snapshot.loading && <div className="dim">Загрузка…</div>}
          {snapshot.error && <div style={{ color: 'var(--red)' }}>{snapshot.error}</div>}
          {!snapshot.loading && !snapshot.error && snapshot.rows.length === 0 &&
            <div className="dim">Активных заказов нет</div>}
          {snapshot.rows.map((o, i) => <OrderRow key={o.id || i} o={o} />)}
        </section>

        {/* Живая лента событий реального времени */}
        <section style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="dim" style={secTitle}>Лента событий</div>
            <div className="spacer" />
            <button className="ghost" onClick={clearEvents} style={{ padding: '4px 10px', fontSize: 12 }}>
              Очистить
            </button>
          </div>
          {events.length === 0 && <div className="dim">Ожидание событий…</div>}
          {events.map((e, i) => (
            <div key={i} style={feedItem}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: reasonColor(e.reason), marginTop: 6 }} />
              <div className="col" style={{ gap: 2 }}>
                <div>{REASON_RU[e.reason] || e.reason || 'событие'}</div>
                <div className="dim mono" style={{ fontSize: 12 }}>
                  {e.order_id ? 'заказ #' + e.order_id : ''}
                  {e.driver_id ? ' · водитель #' + e.driver_id : ''}
                  {' · ' + fmtTime(e.at)}
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function OrderRow({ o }) {
  const status = o.status || '—';
  return (
    <div style={card}>
      <div className="row">
        {o.client_phone
          ? <>
              <div className="mono" style={{ fontWeight: 600 }}>{o.client_phone}</div>
              <span className="dim mono" style={{ fontSize: 12 }}>#{o.id}</span>
            </>
          : <div className="mono" style={{ fontWeight: 600 }}>#{o.id ?? '?'}</div>}
        <div className="spacer" />
        <span style={{ ...badge, color: reasonColor(status), borderColor: reasonColor(status) }}>
          {REASON_RU[status] || status}
        </span>
      </div>
      {(o.pickup_address || o.dropoff_address) && (
        <div className="dim" style={{ fontSize: 13, marginTop: 6 }}>
          {o.pickup_address || '—'} → {o.dropoff_address || '—'}
        </div>
      )}
      <div className="row dim" style={{ fontSize: 12, marginTop: 6, gap: 14 }}>
        {o.price_offered != null && <span>{o.price_offered} ман.</span>}
        {o.driver_phone
          ? <span className="mono">водитель {o.driver_phone}</span>
          : (o.driver_id != null && <span className="mono">водитель #{o.driver_id}</span>)}
        {!o.client_phone && o.client_id != null && <span className="mono">клиент #{o.client_id}</span>}
      </div>
    </div>
  );
}

const head = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '14px 16px', borderBottom: '1px solid var(--border)',
};
const secTitle = { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 };
const card = {
  background: 'var(--bg-elev)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: 12, marginBottom: 10,
};
const badge = {
  fontSize: 12, border: '1px solid', borderRadius: 6, padding: '2px 8px',
};
const feedItem = {
  display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)',
};
