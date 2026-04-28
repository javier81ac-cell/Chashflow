import React, { useState } from 'react'
import { useDatos } from './hooks/useDatos'
import Cargar from './components/Cargar'
import Panel from './components/Panel'
import Movimientos from './components/Movimientos'
import Analisis from './components/Analisis'
import Config from './components/Config'
import ScanTicket from './components/ScanTicket'

const NAV = [
  { id: 'cargar',      label: 'Cargar',      icon: <IconPlus /> },
  { id: 'scan',        label: 'Escanear',    icon: <IconCamera /> },
  { id: 'panel',       label: 'Panel',       icon: <IconGrid /> },
  { id: 'movimientos', label: 'Movimientos', icon: <IconList /> },
  { id: 'analisis',    label: 'Análisis',    icon: <IconStar /> },
  { id: 'config',      label: 'Config',      icon: <IconGear /> },
]

export default function App() {
  const [page, setPage] = useState('cargar')
  const { datos, syncing, error, sync, agregar, eliminar, importar } = useDatos()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, flexShrink: 0, background: '#111',
        borderRight: '1px solid #2a2a2a', display: 'flex',
        flexDirection: 'column', padding: '28px 0',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '0 24px 28px', borderBottom: '1px solid #2a2a2a' }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: '#d4f060', letterSpacing: '.08em' }}>
            Cash<span style={{ color: '#5a5a5a' }}>flow</span>
          </div>
          {syncing && (
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#5a5a5a', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, border: '1.5px solid #3a3a3a', borderTopColor: '#d4f060', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
              sincronizando…
            </div>
          )}
          {error && (
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#f05c5c', marginTop: 6 }}>
              {error}
            </div>
          )}
        </div>

        <nav style={{ padding: '20px 0', flex: 1 }}>
          {NAV.map(({ id, label, icon }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 24px',
                  border: 'none', borderLeft: `2px solid ${active ? '#d4f060' : 'transparent'}`,
                  background: active ? 'rgba(212,240,96,.05)' : 'transparent',
                  color: active ? '#d4f060' : '#5a5a5a',
                  fontSize: 13, fontFamily: "'Syne',sans-serif", fontWeight: active ? 500 : 400,
                  cursor: 'pointer', transition: 'all .15s', textAlign: 'left',
                }}
              >
                <span style={{ opacity: active ? 1 : .6 }}>{icon}</span>
                {label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #2a2a2a' }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#3a3a3a', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Movimientos totales
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 20, color: '#5a5a5a', marginTop: 4 }}>
            {datos.length}
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px 40px', maxWidth: 920 }}>
        {page === 'cargar'      && <Cargar      datos={datos} onAgregar={agregar} />}
        {page === 'scan'        && <ScanTicket  onAgregar={agregar} />}
        {page === 'panel'       && <Panel        datos={datos} />}
        {page === 'movimientos' && <Movimientos  datos={datos} onEliminar={eliminar} onImportar={importar} />}
        {page === 'analisis'    && <Analisis     datos={datos} />}
        {page === 'config'      && <Config       onSync={sync} />}
      </main>
    </div>
  )
}

function IconPlus()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v6M5 8h6"/></svg> }
function IconCamera() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1.5 5.5a1 1 0 011-1h1.4l1-2h4.2l1 2h1.4a1 1 0 011 1v6a1 1 0 01-1 1h-10a1 1 0 01-1-1v-6z"/><circle cx="8" cy="8.5" r="2"/></svg> }
function IconGrid()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg> }
function IconList()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h9M2 12h6"/></svg> }
function IconStar()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5 5 12l.5-3.5L3 6l3.5-.5z"/></svg> }
function IconGear()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2"/></svg> }
