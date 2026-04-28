import React, { useState, useRef } from 'react'
import { Card, Btn, Spinner, Field, Input, Select } from './UI'
import { CATS_GASTO, today } from '../lib/constants'

const ESTADOS = {
  IDLE:      'idle',
  SCANNING:  'scanning',
  RESULTADO: 'resultado',
  GUARDANDO: 'guardando',
}

function comprimirImagen(dataUrl, maxWidth = 800) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width  = img.width
      let height = img.height
      if (width > maxWidth) {
        height = Math.round(height * maxWidth / width)
        width  = maxWidth
      }
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.src = dataUrl
  })
}

async function getApiKey(apiUrl) {
  const r = await fetch(`${apiUrl}?action=getkey`)
  const j = await r.json()
  if (!j.ok) throw new Error('No se pudo obtener la API key')
  return j.key
}

async function analizarConClaude(base64, apiKey) {
  const prompt = `Analizá esta imagen de un ticket, factura o resumen de tarjeta de crédito.
Extraé la información y respondé ÚNICAMENTE con un objeto JSON con este formato exacto, sin texto adicional ni markdown:
{"fecha":"YYYY-MM-DD","importe":1234.56,"descripcion":"nombre del comercio","categoria":"Alimentación","tipo":"gasto"}

Categorías válidas: Alimentación, Transporte, Vivienda, Salud, Educación, Entretenimiento, Ropa, Servicios, Otros gastos
- fecha en formato YYYY-MM-DD, si no se ve usá hoy
- importe como número sin símbolos
- Si hay múltiples items, tomá el total
- Solo el JSON, sin nada más`

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: prompt }
        ]
      }]
    })
  })

  const j = await r.json()
  if (j.error) throw new Error(j.error.message)
  const texto = j.content[0].text.trim()
  return JSON.parse(texto)
}

export default function ScanTicket({ onAgregar }) {
  const [estado, setEstado]   = useState(ESTADOS.IDLE)
  const [preview, setPreview] = useState(null)
  const [error, setError]     = useState('')
  const [ok, setOk]           = useState(false)

  const [fecha, setFecha]     = useState('')
  const [importe, setImporte] = useState('')
  const [desc, setDesc]       = useState('')
  const [cat, setCat]         = useState('')

  const inputRef = useRef()
  const apiUrl   = localStorage.getItem('mf_api_url') || ''

  function handleImagen(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      setPreview(ev.target.result)
      setError('')
      setOk(false)
      await escanear(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  async function escanear(dataUrl) {
    if (!apiUrl) {
      setError('Configurá la URL de Google Sheets en la sección Config primero.')
      return
    }
    setEstado(ESTADOS.SCANNING)
    try {
      const comprimida = await comprimirImagen(dataUrl)
      const base64     = comprimida.split(',')[1]
      const apiKey     = await getApiKey(apiUrl)
      const datos      = await analizarConClaude(base64, apiKey)

      setFecha(datos.fecha       || today())
      setImporte(String(datos.importe || ''))
      setDesc(datos.descripcion  || '')
      setCat(datos.categoria     || '')
      setEstado(ESTADOS.RESULTADO)
    } catch (err) {
      setError('Error al analizar la imagen: ' + err.message)
      setEstado(ESTADOS.IDLE)
    }
  }

  async function handleGuardar() {
    if (!importe || !cat) { setError('Completá al menos el importe y la categoría.'); return }
    setEstado(ESTADOS.GUARDANDO)
    setError('')
    try {
      await onAgregar({ id: Date.now(), fecha, tipo: 'gasto', cat, importe: parseFloat(importe), desc })
      setOk(true)
      setEstado(ESTADOS.IDLE)
      setPreview(null)
      setTimeout(() => setOk(false), 3000)
    } catch (err) {
      setError(err.message)
      setEstado(ESTADOS.RESULTADO)
    }
  }

  function handleReintentar() {
    setEstado(ESTADOS.IDLE)
    setPreview(null)
    setError('')
  }

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Escanear ticket</h1>
        <p style={{ color: '#5a5a5a', fontSize: 13 }}>Sacá una foto y Claude extrae los datos automáticamente</p>
      </div>

      {estado === ESTADOS.IDLE && (
        <Card>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImagen} />
          <div
            onClick={() => inputRef.current.click()}
            style={{ border: '2px dashed #2a2a2a', borderRadius: 10, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#d4f060'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a2a'}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Tocá para sacar una foto</div>
            <div style={{ fontSize: 12, color: '#5a5a5a' }}>o seleccioná una imagen de tu galería</div>
            <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 8, fontFamily: "'IBM Plex Mono',monospace" }}>tickets · facturas · resúmenes de tarjeta</div>
          </div>
          {ok && <div style={{ textAlign: 'center', marginTop: 16, color: '#52c98a', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>✓ Gasto guardado correctamente</div>}
        </Card>
      )}

      {estado === ESTADOS.SCANNING && (
        <Card>
          {preview && <img src={preview} alt="ticket" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8, marginBottom: 20 }} />}
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <Spinner />
            <span style={{ fontSize: 13, color: '#5a5a5a', fontFamily: "'IBM Plex Mono',monospace" }}>Claude está analizando el ticket…</span>
          </div>
        </Card>
      )}

      {estado === ESTADOS.RESULTADO && (
        <Card>
          {preview && <img src={preview} alt="ticket" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 8, marginBottom: 20, border: '1px solid #2a2a2a' }} />}
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#d4f060', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 16 }}>
            ✓ Datos detectados — revisá y confirmá
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Field label="Fecha"><Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></Field>
            <Field label="Importe ($)"><Input type="number" value={importe} onChange={e => setImporte(e.target.value)} step="0.01" min="0" /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <Field label="Categoría">
              <Select value={cat} onChange={e => setCat(e.target.value)}>
                <option value="">— elegir —</option>
                {CATS_GASTO.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Descripción"><Input value={desc} onChange={e => setDesc(e.target.value)} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="accent" onClick={handleGuardar} disabled={estado === ESTADOS.GUARDANDO}>
              {estado === ESTADOS.GUARDANDO ? <><Spinner />Guardando…</> : 'Confirmar y guardar'}
            </Btn>
            <Btn onClick={handleReintentar}>Escanear otro</Btn>
          </div>
        </Card>
      )}

      {error && (
        <div style={{ background: '#2a0f0f', border: '1px solid #3d1a1a', borderRadius: 8, padding: '12px 16px', marginTop: 12, fontSize: 13, color: '#f05c5c', fontFamily: "'IBM Plex Mono',monospace" }}>
          {error}
        </div>
      )}

      {estado === ESTADOS.IDLE && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5a5a5a', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 12 }}>Tips para mejores resultados</div>
          {[['💡','Buena iluminación','Evitá sombras sobre el ticket'],['📐','Encuadre recto','El ticket debe verse completo y derecho'],['🔍','Enfoque nítido','Asegurate que el texto se lea claramente'],['💳','Resúmenes de tarjeta','Funciona con fotos de pantalla también']].map(([icon,titulo,sub]) => (
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
