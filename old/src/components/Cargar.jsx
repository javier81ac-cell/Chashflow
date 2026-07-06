import React, { useState } from 'react'
import { Card, Btn, Field, Input, Select, Spinner } from './UI'
import { CATS_GASTO, CATS_INGRESO, today, fmtNum } from '../lib/constants'

export default function Cargar({ datos, onAgregar }) {
  const [tipo, setTipo] = useState('gasto')
  const [fecha, setFecha] = useState(today())
  const [importe, setImporte] = useState('')
  const [cat, setCat] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')

  const cats = tipo === 'gasto' ? CATS_GASTO : CATS_INGRESO

  async function handleSubmit() {
    if (!fecha || !importe || !cat) { setErr('Completá todos los campos.'); return }
    setErr('')
    setLoading(true)
    try {
      await onAgregar({ id: Date.now(), fecha, tipo, cat, importe: parseFloat(importe), desc })
      setImporte('')
      setCat('')
      setDesc('')
      setOk(true)
      setTimeout(() => setOk(false), 2500)
    } catch (e) {
      setErr(e.message)
    }
    setLoading(false)
  }

  const recientes = [...datos].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id).slice(0, 5)

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Cargar movimiento</h1>
        <p style={{ color: '#5a5a5a', fontSize: 13 }}>Registrá un gasto o ingreso</p>
      </div>

      <Card>
        {/* Tipo toggle */}
        <div style={{ display: 'flex', background: '#1e1e1e', borderRadius: 8, padding: 3, marginBottom: 20, width: 'fit-content' }}>
          {['gasto', 'ingreso'].map(t => (
            <button
              key={t}
              onClick={() => { setTipo(t); setCat('') }}
              style={{
                padding: '7px 24px', borderRadius: 6, border: 'none',
                fontSize: 13, fontWeight: 500, fontFamily: "'Syne',sans-serif",
                cursor: 'pointer', transition: 'all .15s',
                background: tipo === t ? (t === 'gasto' ? '#2a0f0f' : '#0f2a1a') : 'transparent',
                color: tipo === t ? (t === 'gasto' ? '#f05c5c' : '#52c98a') : '#5a5a5a',
              }}
            >
              {t === 'gasto' ? '— Gasto' : '+ Ingreso'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <Field label="Fecha">
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </Field>
          <Field label="Importe ($)">
            <Input type="number" value={importe} onChange={e => setImporte(e.target.value)} placeholder="0.00" min="0" step="0.01" />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <Field label="Categoría">
            <Select value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">— elegir —</option>
              {cats.map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Descripción (opcional)">
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="ej: supermercado" />
          </Field>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Btn variant="accent" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Spinner />Guardando…</> : 'Guardar'}
          </Btn>
          {ok && <span style={{ fontSize: 12, color: '#52c98a', fontFamily: "'IBM Plex Mono',monospace" }}>✓ Guardado</span>}
          {err && <span style={{ fontSize: 12, color: '#f05c5c', fontFamily: "'IBM Plex Mono',monospace" }}>{err}</span>}
        </div>
      </Card>

      {/* Últimos */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #2a2a2a', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5a5a5a', letterSpacing: '.07em', textTransform: 'uppercase' }}>
          Últimos movimientos
        </div>
        {recientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#3a3a3a', fontSize: 13 }}>Sin movimientos aún</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {recientes.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                  <td style={{ padding: '10px 20px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#5a5a5a', whiteSpace: 'nowrap' }}>{m.fecha}</td>
                  <td style={{ padding: '10px 8px', fontSize: 13 }}>{m.desc || m.cat}</td>
                  <td style={{ padding: '10px 8px', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: m.tipo === 'gasto' ? '#f05c5c' : '#52c98a' }}>{m.cat}</td>
                  <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: m.tipo === 'gasto' ? '#f05c5c' : '#52c98a', whiteSpace: 'nowrap' }}>
                    {m.tipo === 'gasto' ? '−' : '+'} ${fmtNum(m.importe)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
