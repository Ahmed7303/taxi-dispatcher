'use strict';

import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { connectSocket, disconnectSocket } from './api/socket';
import LoginScreen from './screens/LoginScreen';
import Shell from './components/Shell';

export default function App() {
  const authed = useStore((s) => s.authed);
  const setSocketStatus = useStore((s) => s.setSocketStatus);
  const pushEvent = useStore((s) => s.pushEvent);

  // Поднимаем сокет, когда авторизованы; гасим при выходе.
  useEffect(() => {
    if (!authed) { disconnectSocket(); setSocketStatus('idle'); return; }
    connectSocket(
      (status) => setSocketStatus(status),
      (payload) => pushEvent(payload),
    );
    return () => disconnectSocket();
  }, [authed, setSocketStatus, pushEvent]);

  return authed ? <Shell /> : <LoginScreen />;
}
