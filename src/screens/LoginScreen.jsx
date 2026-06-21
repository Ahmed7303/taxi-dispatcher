'use strict';

import React, { useState } from 'react';
import { dispatcherLogin } from '../api/client';
import { useStore } from '../store/useStore';

export default function LoginScreen() {
  const setAuthed = useStore((s) => s.setAuthed);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!login || !password) { setError('Введите логин и пароль'); return; }
    setBusy(true); setError('');
    const r = await dispatcherLogin(login.trim(), password);
    setBusy(false);
    if (r.ok) setAuthed(true);
    else setError(r.error);
  }

  function onKey(e) { if (e.key === 'Enter') submit(); }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Такси Диспетчер</div>
        <div className="dim" style={{ marginBottom: 22 }}>Вход в диспетчерский пульт</div>

        <label className="dim" style={lbl}>Логин</label>
        <input value={login} onChange={(e) => setLogin(e.target.value)} onKeyDown={onKey}
          autoFocus placeholder="dispatcher" />

        <label className="dim" style={{ ...lbl, marginTop: 14 }}>Пароль</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKey} placeholder="••••••••" />

        {error ? <div style={{ color: 'var(--red)', marginTop: 14, fontSize: 13 }}>{error}</div> : null}

        <button className="primary" style={{ marginTop: 22, width: '100%' }}
          onClick={submit} disabled={busy}>
          {busy ? 'Вход…' : 'Войти'}
        </button>

        <div className="dim" style={{ marginTop: 18, fontSize: 12, textAlign: 'center' }}>
          taxi.achar7303ai.com
        </div>
      </div>
    </div>
  );
}

const wrap = {
  height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'radial-gradient(1200px 600px at 50% -10%, #1a2030 0%, var(--bg) 60%)',
};
const card = {
  width: 360, background: 'var(--bg-elev)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
};
const lbl = { display: 'block', fontSize: 12, marginBottom: 6 };
