import React, { useState, useRef } from 'react'
import { Card, Btn, Spinner, Field, Input, Select } from './UI'
import { CATS_GASTO, today } from '../lib/constants'

const ESTADOS = { IDLE: 'idle', SCANNING: 'scanning', RESULTADO: 'resultado', GUARDANDO: 'guardando' }

function comprimirImagen(dataUrl, maxWidth = 1600) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width, height = img.height
      if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = dataUrl
  })
}

export default function ScanTicket({ onAgregar }) {
  const [estado, setEstado]         = useState(ESTADOS.IDLE)
  const [preview, setPreview]       = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [seleccionados, setSeleccionados] = useState({})
  const [error, setError]           = useState('')
  const [ok, setOk]                 = useState(false)
  const [guardando, setGuardando]   = useState(false)
  const inputRef = useRef()

  function handleImagen(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      setPreview(ev.target.result)
      setError(''); setOk(false)
      await escanear(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  async function escanear(dataUrl) {
    setEstado(ESTADOS.SCANNING)
    try {
      const comprimida = await comprimirImagen(dataUrl)
      const base64 = comprimida.split(',')[1]

      const r = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: 'image/jpeg' })
      })
      const j = await r.json()
      if (!j.ok) { setError(j.error || 'Error al procesar.'); setEstado(ESTADOS.IDLE); return }

      // Inicializar todos como seleccionados
      const sel = {}
      j.movimientos.forEach((_, i) => sel[i] = true)
      setMovimientos(j.movimientos)
      setSeleccionados(sel)
      setEstado(ESTADOS.RESULTADO)
    } catch (err) {
      setError('Error: ' + err.message)
      setEstado(ESTADOS.IDLE)
    }
  }

  function toggleSeleccion(i) {
    setSeleccionados(prev => ({ ...prev, [i]: !prev[i] }))
  }

  function updateMovimiento(i, campo, valor) {
    setMovimientos(prev => prev.map((m, idx) => idx === i ? { ...m, [campo]: valor } : m))
  }

  async function handleGuardar() {
    const aGuardar = movimientos.filter((_, i) => seleccionados[i])
    if (!aGuardar.length) { setError('Seleccioná al menos un movimiento.'); return }
    setGuardando(true); setError('')
    try {
      for (const m of aGuardar) {
        await onAgregar({ id: Date.now() + Math.random(), fecha: m.fecha, tipo: m.tipo || 'gasto', cat: m.categoria, importe: parseFloat(m.importe), desc: m.descripcion })
      }
      setOk(true); setEstado(ESTADOS.IDLE); setPreview(null); setMovimientos([])
      setTimeout(() => setOk(false), 3000)
    } catch (err) {
      setError(err.message)
    }
    setGuardando(false)
  }

  function handleReintentar() { setEstado(ESTADOS.IDLE); setPreview(null); setMovimientos([]); setError('') }

  const selCount = Object.values(seleccionados).filter(Boolean).length

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Escanear comprobante</h1>
        <p style={{ color: '#5a5a5a', fontSize: 13 }}>Subí una foto y Claude detecta todos los movimientos automáticamente</p>
      </div>

      {estado === ESTADOS.IDLE && (
        <Card>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImagen} />
          <div onClick={() => inputRef.current.click()}
            style={{ border: '2px dashed #2a2a2a', borderRadius: 10, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#d4f060'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a2a'}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Tocá para sacar una foto</div>
            <div style={{ fontSize: 12, color: '#5a5a5a' }}>o seleccioná una imagen de tu galería</div>
            <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 8, fontFamily: "'IBM Plex Mono',monospace" }}>tickets · facturas · resúmenes de tarjeta</div>
          </div>
          {ok && <div style={{ textAlign: 'center', marginTop: 16, color: '#52c98a', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>✓ Movimientos guardados correctamente</div>}
        </Card>
      )}

      {estado === ESTADOS.SCANNING && (
        <Card>
          {preview && <img src={preview} alt="comprobante" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8, marginBottom: 20 }} />}
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <Spinner />
            <span style={{ fontSize: 13, color: '#5a5a5a', fontFamily: "'IBM Plex Mono',monospace" }}>Claude está leyendo todos los movimientos…</span>
          </div>
        </Card>
      )}

      {estado === ESTADOS.RESULTADO && (
        <>
          {/* Imagen */}
          {preview && (
            <Card style={{ padding: 12, marginBottom: 14 }}>
              <img src={preview} alt="comprobante" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6 }} />
            </Card>
          )}

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#d4f060', letterSpacing: '.07em', textTransform: 'uppercase' }}>
              {movimientos.length} movimientos detectados — tildá los que querés guardar
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn small onClick={() => { const s = {}; movimientos.forEach((_, i) => s[i] = true); setSeleccionados(s) }}>Todos</Btn>
              <Btn small onClick={() => setSeleccionados({})}>Ninguno</Btn>
            </div>
          </div>

          {/* Lista de movimientos */}
          <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
            {movimientos.map((m, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12,
                padding: '12px 16px', borderBottom: '1px solid #1e1e1e',
                background: seleccionados[i] ? 'rgba(212,240,96,.03)' : 'transparent',
                opacity: seleccionados[i] ? 1 : 0.4, transition: 'all .15s'
              }}>
                {/* Checkbox */}
                <div onClick={() => toggleSeleccion(i)} style={{ cursor: 'pointer', paddingTop: 2 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${seleccionados[i] ? '#d4f060' : '#3a3a3a'}`,
                    background: seleccionados[i] ? '#d4f060' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s'
                  }}>
                    {seleccionados[i] && <span style={{ fontSize: 11, color: '#0c0c0c', fontWeight: 700 }}>✓</span>}
                  </div>
                </div>

                {/* Campos editables */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#5a5a5a', fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', marginBottom: 3 }}>Fecha</div>
                    <input
                      type="date" value={m.fecha || today()}
                      onChange={e => updateMovimiento(i, 'fecha', e.target.value)}
                      style={{ width: '100%', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 5, color: '#ede9e1', fontFamily: "'Syne',sans-serif", fontSize: 12, padding: '5px 8px' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#5a5a5a', fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', marginBottom: 3 }}>Importe</div>
                    <input
                      type="number" value={m.importe || ''}
                      onChange={e => updateMovimiento(i, 'importe', e.target.value)}
                      style={{ width: '100%', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 5, color: '#f05c5c', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, padding: '5px 8px' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#5a5a5a', fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', marginBottom: 3 }}>Descripción</div>
                    <input
                      type="text" value={m.descripcion || ''}
                      onChange={e => updateMovimiento(i, 'descripcion', e.target.value)}
                      style={{ width: '100%', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 5, color: '#ede9e1', fontFamily: "'Syne',sans-serif", fontSize: 12, padding: '5px 8px' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#5a5a5a', fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', marginBottom: 3 }}>Categoría</div>
                    <select
                      value={m.categoria || ''}
                      onChange={e => updateMovimiento(i, 'categoria', e.target.value)}
                      style={{ width: '100%', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 5, color: '#ede9e1', fontFamily: "'Syne',sans-serif", fontSize: 12, padding: '5px 8px' }}
                    >
                      <option value="">—</option>
                      {CATS_GASTO.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Resumen y botones */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: '#5a5a5a' }}>
              {selCount} de {movimientos.length} seleccionados ·{' '}
              <span style={{ color: '#f05c5c' }}>
                ${movimientos.filter((_, i) => seleccionados[i]).reduce((s, m) => s + parseFloat(m.importe || 0), 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn onClick={handleReintentar}>Cancelar</Btn>
              <Btn variant="accent" onClick={handleGuardar} disabled={guardando || !selCount}>
                {guardando ? <><Spinner />Guardando…</> : `Guardar ${selCount} movimiento${selCount !== 1 ? 's' : ''}`}
              </Btn>
            </div>
          </div>
        </>
      )}

      {error && (
        <div style={{ background: '#2a0f0f', border: '1px solid #3d1a1a', borderRadius: 8, padding: '12px 16px', marginTop: 12, fontSize: 13, color: '#f05c5c', fontFamily: "'IBM Plex Mono',monospace" }}>
          {error}
        </div>
      )}

      {estado === ESTADOS.IDLE && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5a5a5a', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 12 }}>Tips para mejores resultados</div>
          {[['💡','Buena iluminación','Evitá sombras sobre el ticket'],['📐','Encuadre completo','Incluí todas las líneas del resumen'],['🔍','Texto nítido','Asegurate que todos los números se lean bien'],['💳','Capturas de pantalla','Funcionan perfecto para resúmenes digitales']].map(([icon,titulo,sub]) => (
            <div key={titulo} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <div><div style={{ fontSize: 13, fontWeight: 500 }}>{titulo}</div><div style={{ fontSize: 12, color: '#5a5a5a' }}>{sub}</div></div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
