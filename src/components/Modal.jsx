'use strict';

import React from 'react';

export default function Modal({ title, children, onClose }) {
  return (
    <div style={overlay} onMouseDown={onClose}>
      <div style={box} onMouseDown={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <div className="spacer" />
          <button className="ghost" style={{ padding: '4px 10px' }} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
};
const box = {
  width: 380, background: 'var(--bg-elev)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: 22, boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
};
