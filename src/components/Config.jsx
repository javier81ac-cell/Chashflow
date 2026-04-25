import React, { useState } from 'react'
import { Card, Btn, Field, Input, Spinner } from './UI'
import { getApiUrl, saveApiUrl } from '../lib/sheets'

export default function Config({ onSync }) {
  const [url, setUrl] = useState(getApiUrl)
  const [status, setStatus] = useState('')
  const [testing, setTesting] = useState(false)

  async function handleSave() {
    saveApiUrl(url.trim())
    if (url.trim()) {
      setTesting(true)
      setStatus('Probando conexión…')
      await onSync()
      setStatus('✓ Conectado. Datos sincronizados.')
      setTesting(false)
    } else {
      setStatus('Usando modo local.')
    }
  }

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Configurar</h1>
        <p style={{ color: '#5a5a5a', fontSize: 13 }}>Conectá tu Google Sheet como base de datos</p>
      </div>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>1. Creá el Google Sheet</h3>
        <p style={{ color: '#5a5a5a', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
          Abrí Google Sheets y creá una hoja nueva. Nombrá la primera pestaña <code style={{ fontFamily: "'IBM Plex Mono',monospace", background: '#1e1e1e', padding: '2px 6px', borderRadius: 4, color: '#d4f060', fontSize: 12 }}>Movimientos</code>.
          En la fila 1 poné estos encabezados en A1:F1:
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          {['id','fecha','tipo','cat','importe','desc'].map(h => (
            <code key={h} style={{ fontFamily: "'IBM Plex Mono',monospace", background: '#1e1e1e', padding: '4px 10px', borderRadius: 6, color: '#d4f060', fontSize: 12, border: '1px solid #2a2a2a' }}>{h}</code>
          ))}
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>2. Creá el Apps Script</h3>
        <p style={{ color: '#5a5a5a', fontSize: 13, lineHeight: 1.7 }}>
          En tu Sheet: <strong>Extensiones → Apps Script</strong>. Borrá el contenido y pegá el código del archivo <code style={{ fontFamily: "'IBM Plex Mono',monospace", background: '#1e1e1e', padding: '2px 6px', borderRadius: 4, color: '#d4f060', fontSize: 12 }}>apps-script.gs</code> incluido en el proyecto.<br /><br />
          Reemplazá <code style={{ fontFamily: "'IBM Plex Mono',monospace", background: '#1e1e1e', padding: '2px 6px', borderRadius: 4, color: '#d4f060', fontSize: 12 }}>TU_SHEET_ID_AQUI</code> con el ID de tu hoja (el texto entre <code style={{ fontFamily: "'IBM Plex Mono',monospace", background: '#1e1e1e', padding: '2px 6px', borderRadius: 4, color: '#d4f060', fontSize: 12 }}>/d/</code> y <code style={{ fontFamily: "'IBM Plex Mono',monospace", background: '#1e1e1e', padding: '2px 6px', borderRadius: 4, color: '#d4f060', fontSize: 12 }}>/edit</code> en la URL).<br /><br />
          Luego: <strong>Implementar → Nueva implementación → Aplicación web</strong>. Ejecutar como: <em>Yo</em>. Acceso: <em>Cualquier usuario</em>. Copiá la URL.
        </p>
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>3. Pegá la URL aquí</h3>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <Field label="URL del Apps Script" style={{ flex: 1 }}>
            <Input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn variant="accent" onClick={handleSave} disabled={testing}>
            {testing ? <><Spinner />Conectando…</> : 'Guardar y conectar'}
          </Btn>
          {status && <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: status.startsWith('✓') ? '#52c98a' : '#5a5a5a' }}>{status}</span>}
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Modo offline</h3>
        <p style={{ color: '#5a5a5a', fontSize: 13, lineHeight: 1.6 }}>
          Sin Google Sheets, los datos se guardan en este navegador. Funcionan los botones de exportar/importar en la sección Movimientos.
        </p>
      </Card>
    </div>
  )
}
