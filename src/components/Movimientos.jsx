import React, { useState, useMemo } from 'react'
import { Card, Btn, Select, Empty } from './UI'
import { getMeses, mesLabel, fmtNum } from '../lib/constants'

export default function Movimientos({ datos, onEliminar, onImportar }) {
  const [filMes, setFilMes]   = useState('')
  const [filTipo, setFilTipo] = useState('')
  const [filCat, setFilCat]   = useState('')

  const meses   = useMemo(() => getMeses(datos), [datos])
  const allCats = useMemo(() => [...new Set(datos.map(d => d.cat))].sort(), [datos])

  const filtrados = useMemo(() => {
    let r = [...datos].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
    if (filMes)  r = r.filter(d => d.fecha.startsWith(filMes))
    if (filTipo) r = r.filter(d => d.tipo === filTipo)
    if (filCat)  r = r.filter(d => d.cat === filCat)
    return r
  }, [datos, filMes, filTipo, filCat])

  function exportCSV() {
    const rows = ['id,fecha,tipo,categoria,importe,descripcion',
      ...filtrados.map(d => `${d.id},${d.fecha},${d.tipo},"${d.cat}",${d.importe},"${d.desc||''}"`)
    ].join('\n')
    dl(rows, `finanzas_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv')
  }

  function exportJSON() {
    dl(JSON.stringify(datos, null, 2), `finanzas_${new Date().toISOString().slice(0,10)}.json`, 'application/json')
  }

  function importJSON(e) {
    const file = e.target.files[0]
    if (!file) return
    const r = new FileReader()
    r.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result)
        onImportar(parsed)
        alert(`Importados ${parsed.length} movimientos.`)
      } catch { alert('Archivo inválido.') }
    }
    r.readAsText(file)
  }

  function dl(content, name, type) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type }))
    a.download = name
    a.click()
  }

  const selStyle = { background: '#151515', border: '1px solid #2a2a2a', borderRadius: 7, color: '#ede9e1', fontFamily: "'Syne',sans-serif", fontSize: 13, padding: '7px 10px', outline: 'none' }

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Movimientos</h1>
        <p style={{ color: '#5a5a5a', fontSize: 13 }}>Historial completo</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={selStyle} value={filMes} onChange={e => setFilMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {meses.map(m => <option key={m} value={m}>{mesLabel(m)}</option>)}
        </select>
        <select style={selStyle} value={filTipo} onChange={e => setFilTipo(e.target.value)}>
          <option value="">Todo</option>
          <option value="gasto">Gastos</option>
          <option value="ingreso">Ingresos</option>
        </select>
        <select style={selStyle} value={filCat} onChange={e => setFilCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {allCats.map(c => <option key={c}>{c}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Btn small onClick={exportCSV}>Exportar CSV</Btn>
          <Btn small onClick={exportJSON}>Exportar JSON</Btn>
          <Btn small onClick={() => document.getElementById('inp-import').click()}>Importar</Btn>
          <input type="file" id="inp-import" accept=".json" style={{ display: 'none' }} onChange={importJSON} />
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {filtrados.length === 0 ? <Empty text="Sin movimientos para estos filtros." /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                {['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Importe', ''].map(h => (
                  <th key={h} style={{ textAlign: h === 'Importe' ? 'right' : 'left', padding: '10px 16px', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: '#5a5a5a', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                  <td style={{ padding: '10px 16px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#5a5a5a', whiteSpace: 'nowrap' }}>{m.fecha}</td>
                  <td style={{ padding: '10px 8px', fontSize: 13 }}>{m.desc || '—'}</td>
                  <td style={{ padding: '10px 8px', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: '#5a5a5a' }}>{m.cat}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", background: m.tipo === 'gasto' ? '#2a0f0f' : '#0f2a1a', color: m.tipo === 'gasto' ? '#f05c5c' : '#52c98a' }}>{m.tipo}</span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: m.tipo === 'gasto' ? '#f05c5c' : '#52c98a', whiteSpace: 'nowrap' }}>
                    {m.tipo === 'gasto' ? '−' : '+'} ${fmtNum(m.importe)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Btn small variant="danger" onClick={() => { if (confirm('¿Eliminar este movimiento?')) onEliminar(m.id) }}>×</Btn>
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
