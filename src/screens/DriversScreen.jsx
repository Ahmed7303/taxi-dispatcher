'use strict';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchOverview, topupTokens, unfreezeDriver } from '../api/dispatcher';
import { getSocket } from '../api/socket';
import Modal from '../components/Modal';

const TARIFF_RU = { econom: 'Эконом', vip: 'ВИП', comfort: 'Комфорт' };
const MOD_RU = {
  approved: { t: 'Одобрен', c: 'var(--green)' },
  pending: { t: 'На модерации', c: 'var(--yellow)' },
  rejected: { t: 'Отклонён', c: 'var(--red)' },
};

export default function DriversScreen() {
  const [state, setState] = useState({ loading: true, drivers: [], error: null });
  const [query, setQuery] = useState('');
  const [topupFor, setTopupFor] = useState(null); // объект водителя или null
  const [flash, setFlash] = useState(null); // короткое уведомление

  const load = useCallback(async () => {
    setState((p) => ({ ...p, loading: true, error: null }));
    const r = await fetchOverview();
    if (r.ok) setState({ loading: false, drivers: r.drivers, error: null });
    else setState({ loading: false, drivers: [], error: r.error });
  }, []);

  useEffect(() => { load(); }, [load]);

  // живое обновление баланса: бэкенд шлёт balance:update водителю,
  // но диспетчер видит изменения через перезагрузку; здесь слушаем overview-события,
  // чтобы подсветить, что что-то поменялось, и не заставлять жать «Обновить».
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onOverview = (e) => {
      if (e && (e.reason === 'driver_status' || e.reason === 'topup')) load();
    };
    s.on('overview:update', onOverview);
    return () => { s.off('overview:update', onOverview); };
  }, [load]);

  function showFlash(text, ok = true) {
    setFlash({ text, ok });
    setTimeout(() => setFlash(null), 2600);
  }

  async function doUnfreeze(d) {
    const r = await unfreezeDriver(d.id);
    if (r.ok) { showFlash(`Водитель #${d.id} разморожен`); load(); }
    else showFlash(r.error, false);
  }

  const filtered = state.drivers.filter((d) => {
    const q = query.replace(/\D/g, '');
    if (!q) return true;
    const phone = (d.phone || '').replace(/\D/g, '');
    return phone.includes(q);
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={head}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Водители</div>
        <div style={{ width: 260 }}>
          <input placeholder="Поиск по номеру телефона"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="spacer" />
        <span className="dim" style={{ fontSize: 13 }}>{filtered.length} из {state.drivers.length}</span>
        <button onClick={load}>Обновить</button>
      </header>

      {flash && (
        <div style={{ ...flashBar, borderColor: flash.ok ? 'var(--green)' : 'var(--red)',
          color: flash.ok ? 'var(--green)' : 'var(--red)' }}>
          {flash.text}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {state.loading && <div className="dim">Загрузка…</div>}
        {state.error && <div style={{ color: 'var(--red)' }}>{state.error}</div>}
        {!state.loading && !state.error && filtered.length === 0 &&
          <div className="dim">Водителей не найдено</div>}

        {filtered.length > 0 && (
          <table style={table}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={th}>ID</th>
                <th style={th}>Имя</th>
                <th style={th}>Телефон</th>
                <th style={th}>Машина</th>
                <th style={th}>Тариф</th>
                <th style={th}>Статус</th>
                <th style={{ ...th, textAlign: 'right' }}>Токены</th>
                <th style={th}>Линия</th>
                <th style={{ ...th, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const mod = MOD_RU[d.moderation_status] || { t: d.moderation_status, c: 'var(--text-dim)' };
                const online = d.line_status === 'online';
                return (
                  <tr key={d.id} style={tr}>
                    <td style={{ ...td, fontFamily: 'var(--mono)' }}>{d.id}</td>
                    <td style={td}>{d.name || '—'}</td>
                    <td style={{ ...td, fontFamily: 'var(--mono)' }}>{d.phone || '—'}</td>
                    <td style={td}>
                      <div>{d.car_make_model || '—'}</div>
                      <div className="dim mono" style={{ fontSize: 12 }}>{d.car_plate || ''}</div>
                    </td>
                    <td style={td}>{TARIFF_RU[d.tariff] || d.tariff}</td>
                    <td style={td}><span style={{ color: mod.c }}>{mod.t}</span></td>
                    <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                      {d.token_balance ?? 0}
                    </td>
                    <td style={td}>
                      <span className="row" style={{ gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 8,
                          background: online ? 'var(--green)' : 'var(--text-dim)' }} />
                        <span className="dim" style={{ fontSize: 12 }}>{online ? 'на линии' : 'офлайн'}</span>
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="primary" style={btnSm} onClick={() => setTopupFor(d)}>
                        Токены
                      </button>
                      {' '}
                      <button style={btnSm} onClick={() => doUnfreeze(d)} title="Снять заморозку">
                        Разморозить
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {topupFor && (
        <TopupModal driver={topupFor}
          onClose={() => setTopupFor(null)}
          onDone={(balance) => {
            setTopupFor(null);
            showFlash(`Баланс водителя #${topupFor.id}: ${balance} токенов`);
            load();
          }}
          onError={(msg) => showFlash(msg, false)} />
      )}
    </div>
  );
}

function TopupModal({ driver, onClose, onDone, onError }) {
  const [amount, setAmount] = useState('10');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const n = parseInt(amount, 10);
    if (!Number.isInteger(n) || n === 0) { onError('Введите ненулевое целое'); return; }
    setBusy(true);
    const r = await topupTokens(driver.id, n, reason || undefined);
    setBusy(false);
    if (r.ok) onDone(r.balance);
    else onError(r.error);
  }

  return (
    <Modal title={`Токены — ${driver.name || 'водитель #' + driver.id}`} onClose={onClose}>
      <div className="dim" style={{ marginBottom: 14, fontSize: 13 }}>
        Текущий баланс: <b style={{ color: 'var(--text)' }}>{driver.token_balance ?? 0}</b> токенов.
        Положительное число — пополнить, отрицательное — списать.
      </div>
      <label className="dim" style={lbl}>Количество</label>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      <label className="dim" style={{ ...lbl, marginTop: 12 }}>Причина (необязательно)</label>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Пополнение" />
      <div className="row" style={{ marginTop: 20, justifyContent: 'flex-end', gap: 10 }}>
        <button className="ghost" onClick={onClose}>Отмена</button>
        <button className="primary" onClick={submit} disabled={busy}>
          {busy ? '…' : 'Применить'}
        </button>
      </div>
    </Modal>
  );
}

const head = {
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '14px 16px', borderBottom: '1px solid var(--border)',
};
const flashBar = {
  margin: '10px 16px 0', padding: '8px 12px', border: '1px solid',
  borderRadius: 8, fontSize: 13, background: 'var(--bg-elev)',
};
const table = { width: '100%', borderCollapse: 'collapse', fontSize: 14 };
const th = {
  padding: '8px 10px', borderBottom: '1px solid var(--border)',
  color: 'var(--text-dim)', fontWeight: 600, fontSize: 12,
  textTransform: 'uppercase', letterSpacing: 0.4,
};
const tr = { borderBottom: '1px solid var(--border)' };
const td = { padding: '10px', verticalAlign: 'top' };
const btnSm = { padding: '5px 10px', fontSize: 13 };
const lbl = { display: 'block', fontSize: 12, marginBottom: 6 };
