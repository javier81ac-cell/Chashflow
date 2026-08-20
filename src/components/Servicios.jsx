import React, { useState } from 'react'
import { Card, Btn, Field, Input, Empty, Spinner, SectionTitle } from './UI'
import { fmtNum, today, parseFechaFlexible, normalizarFechaDisplay, fmtFecha } from '../lib/constants'

function diasHasta(fecha) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const v = parseFechaFlexible(fecha)
  v.setHours(0, 0, 0, 0)
  return Math.round((v - hoy) / 86400000)
}

function EstadoVencimiento({ fecha, diasAviso }) {
  const dias = diasHasta(fecha)
  if (isNaN(dias)) {
    return (
      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", background: '#2a2a2a', color: '#5a5a5a' }}>
        fecha inválida
      </span>
    )
  }
  let color = '#5a5a5a', bg = 'transparent', txt = `en ${dias} días`
  if (dias < 0)            { color = '#f05c5c'; bg = '#2a0f0f'; txt = `vencido hace ${Math.abs(dias)}d` }
  else if (dias === 0)     { color = '#f05c5c'; bg = '#2a0f0f'; txt = 'vence hoy' }
  else if (dias <= diasAviso) { color = '#f0b340'; bg = '#2a1f0a'; txt = `en ${dias}d` }
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", background: bg, color }}>
      {txt}
    </span>
  )
}

export default function Servicios({ servicios, config, syncing, agregar, editar, eliminar, guardarConfig, avisarAhora }) {
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [vencimiento, setVencimiento] = useState(today())
  const [recurrente, setRecurrente] = useState(true)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const [telefono, setTelefono] = useState(config.telefono || '')
  const [apikey, setApikey] = useState(config.apikey || '')
  const [diasAviso, setDiasAviso] = useState(config.diasAviso ?? 3)
  const [cfgMsg, setCfgMsg] = useState('')
  const [avisando, setAvisando] = useState(false)
  const [avisoMsg, setAvisoMsg] = useState('')

  function limpiarForm() {
    setNombre(''); setMonto(''); setVencimiento(today()); setRecurrente(true); setEditId(null)
  }

  async function handleGuardar() {
    if (!nombre || !monto || !vencimiento) { setErr('Completá nombre, monto y vencimiento.'); return }
    setErr(''); setLoading(true)
    try {
      const data = { nombre, monto: parseFloat(monto), vencimiento, recurrente }
      if (editId) {
        const actual = servicios.find(s => s.id === editId)
        await editar({ ...actual, ...data, id: editId })
      } else {
        await agregar({ id: Date.now(), ...data })
      }
      limpiarForm()
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  function handleEditar(s) {
    setEditId(s.id); setNombre(s.nombre); setMonto(String(s.monto))
    setVencimiento(s.vencimiento); setRecurrente(!!s.recurrente)
  }

  async function handleGuardarConfig() {
    setCfgMsg('')
    try {
      await guardarConfig({ telefono, apikey, diasAviso: Number(diasAviso) })
      setCfgMsg('✓ Configuración guardada')
      setTimeout(() => setCfgMsg(''), 2500)
    } catch (e) { setCfgMsg(e.message) }
  }

  async function handleAvisarAhora() {
    setAvisando(true); setAvisoMsg('')
    try {
      const { enviados, candidatos } = await avisarAhora()
      if (candidatos === 0) {
        setAvisoMsg('No hay vencimientos dentro del rango de aviso.')
      } else if (enviados === candidatos) {
        setAvisoMsg(`✓ ${enviados} aviso(s) enviado(s) por WhatsApp`)
      } else {
        setAvisoMsg(`⚠ Había ${candidatos} vencimiento(s) para avisar pero falló el envío. Revisá que el teléfono y el apikey estén guardados y sean correctos.`)
      }
    } catch (e) { setAvisoMsg(e.message) }
    setAvisando(false)
  }

  const ordenados = [...servicios]
    .filter(s => s && s.vencimiento)
    .map(s => ({ ...s, vencimientoDisplay: normalizarFechaDisplay(s.vencimiento) }))
    .sort((a, b) => a.vencimientoDisplay.localeCompare(b.vencimientoDisplay))

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Servicios</h1>
        <p style={{ color: '#5a5a5a', fontSize: 13 }}>Vencimientos y avisos automáticos por WhatsApp</p>
      </div>

      {/* Form alta/edición */}
      <Card>
        <SectionTitle>{editId ? 'Editar servicio' : 'Nuevo servicio'}</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <Field label="Nombre">
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="ej: Netflix, Luz, Alquiler" />
          </Field>
          <Field label="Monto ($)">
            <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" min="0" step="0.01" />
          </Field>
          <Field label="Vencimiento">
            <Input type="date" value={vencimiento} onChange={e => setVencimiento(e.target.value)} />
          </Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ede9e1', cursor: 'pointer' }}>
            <input type="checkbox" checked={recurrente} onChange={e => setRecurrente(e.target.checked)} />
            Se repite todos los meses
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Btn variant="accent" onClick={handleGuardar} disabled={loading}>
            {loading ? <><Spinner />Guardando…</> : editId ? 'Guardar cambios' : 'Agregar servicio'}
          </Btn>
          {editId && <Btn small onClick={limpiarForm}>Cancelar</Btn>}
          {err && <span style={{ fontSize: 12, color: '#f05c5c', fontFamily: "'IBM Plex Mono',monospace" }}>{err}</span>}
        </div>
      </Card>

      {/* Lista */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5a5a5a', letterSpacing: '.07em', textTransform: 'uppercase' }}>
            Servicios cargados {syncing && '· sincronizando…'}
          </span>
        </div>
        {ordenados.length === 0 ? <Empty text="Sin servicios cargados aún." /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {ordenados.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                  <td style={{ padding: '10px 20px', fontSize: 13 }}>{s.nombre}{s.recurrente && <span style={{ color: '#3a3a3a', fontSize: 11 }}> · mensual</span>}</td>
                  <td style={{ padding: '10px 8px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#5a5a5a', whiteSpace: 'nowrap' }}>{fmtFecha(s.vencimientoDisplay)}</td>
                  <td style={{ padding: '10px 8px' }}><EstadoVencimiento fecha={s.vencimiento} diasAviso={config.diasAviso ?? 3} /></td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, whiteSpace: 'nowrap' }}>
                    ${fmtNum(s.monto)}
                  </td>
                  <td style={{ padding: '10px 12px', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <Btn small onClick={() => handleEditar(s)}>Editar</Btn>
                    <Btn small variant="danger" onClick={() => { if (confirm('¿Eliminar este servicio?')) eliminar(s.id) }}>×</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Config de notificaciones */}
      <Card style={{ marginTop: 8 }}>
        <SectionTitle>Aviso por WhatsApp (CallMeBot)</SectionTitle>
        <p style={{ fontSize: 12, color: '#5a5a5a', lineHeight: 1.6, marginBottom: 16 }}>
          Agregá el contacto <strong>+34 611 01 16 37</strong> en tu WhatsApp y enviale el mensaje
          <em> "Autorizo callmebot a enviarme mensajes"</em>. Te va a responder con tu apikey personal — pegalo acá abajo.
          El sistema revisa los vencimientos automáticamente una vez por día.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
          <Field label="Teléfono (con código de país)">
            <Input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="ej: 5491122334455" />
          </Field>
          <Field label="Apikey de CallMeBot">
            <Input value={apikey} onChange={e => setApikey(e.target.value)} placeholder="apikey" />
          </Field>
          <Field label="Avisar con cuántos días de anticipación">
            <Input type="number" min="0" value={diasAviso} onChange={e => setDiasAviso(e.target.value)} />
          </Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Btn variant="accent" onClick={handleGuardarConfig}>Guardar configuración</Btn>
          <Btn onClick={handleAvisarAhora} disabled={avisando}>{avisando ? <><Spinner />Enviando…</> : 'Avisar ahora'}</Btn>
          {cfgMsg && <span style={{ fontSize: 12, color: cfgMsg.startsWith('✓') ? '#52c98a' : '#f05c5c', fontFamily: "'IBM Plex Mono',monospace" }}>{cfgMsg}</span>}
          {avisoMsg && <span style={{ fontSize: 12, color: avisoMsg.startsWith('✓') ? '#52c98a' : '#f05c5c', fontFamily: "'IBM Plex Mono',monospace" }}>{avisoMsg}</span>}
        </div>
      </Card>
    </div>
  )
}
