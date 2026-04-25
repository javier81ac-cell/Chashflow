import React from 'react'

const s = {
  // Metric card
  metric: {
    background: '#151515',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    padding: '18px 20px',
  },
  metricLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: '#5a5a5a',
    letterSpacing: '.07em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  metricValue: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 26,
    fontWeight: 400,
  },
  metricSub: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: '#5a5a5a',
    marginTop: 4,
  },
  // Card
  card: {
    background: '#151515',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: '20px 22px',
    marginBottom: 14,
  },
  // Badge
  badgeGasto: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    background: '#2a1010',
    color: '#f05c5c',
  },
  badgeIngreso: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    background: '#0f2a1a',
    color: '#52c98a',
  },
}

export function MetricCard({ label, value, sub, color }) {
  const colorMap = { green: '#52c98a', red: '#f05c5c', accent: '#d4f060', muted: '#5a5a5a' }
  return (
    <div style={s.metric}>
      <div style={s.metricLabel}>{label}</div>
      <div style={{ ...s.metricValue, color: colorMap[color] || '#ede9e1' }}>{value}</div>
      {sub && <div style={s.metricSub}>{sub}</div>}
    </div>
  )
}

export function Card({ children, style }) {
  return <div style={{ ...s.card, ...style }}>{children}</div>
}

export function Badge({ tipo }) {
  return <span style={tipo === 'gasto' ? s.badgeGasto : s.badgeIngreso}>{tipo}</span>
}

export function Btn({ children, onClick, variant = 'default', small, disabled, style }) {
  const base = {
    padding: small ? '5px 12px' : '9px 20px',
    borderRadius: 8,
    border: '1px solid #2a2a2a',
    background: 'transparent',
    color: '#ede9e1',
    fontSize: small ? 12 : 13,
    fontWeight: 500,
    fontFamily: "'Syne', sans-serif",
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all .15s',
  }
  const variants = {
    accent: { background: '#d4f060', color: '#0c0c0c', border: 'none' },
    danger: { color: '#f05c5c', borderColor: '#2a1010' },
    ghost:  { border: '1px solid transparent' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...(variants[variant] || {}), ...style }}
    >
      {children}
    </button>
  )
}

export function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: '#5a5a5a', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: '#1e1e1e',
  border: '1px solid #2a2a2a',
  borderRadius: 7,
  color: '#ede9e1',
  fontFamily: "'Syne', sans-serif",
  fontSize: 14,
  padding: '9px 12px',
  outline: 'none',
}

export function Input(props) {
  return <input style={inputStyle} {...props} />
}

export function Select({ children, ...props }) {
  return (
    <select style={{ ...inputStyle, cursor: 'pointer' }} {...props}>
      {children}
    </select>
  )
}

export function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14,
      border: '2px solid #2a2a2a', borderTopColor: '#d4f060',
      borderRadius: '50%', animation: 'spin .7s linear infinite',
      verticalAlign: 'middle', marginRight: 6,
    }} />
  )
}

export function Empty({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#3a3a3a', fontSize: 13, fontFamily: "'IBM Plex Mono',monospace" }}>
      {text || 'Sin datos aún.'}
    </div>
  )
}

export function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5a5a5a', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </div>
  )
}
