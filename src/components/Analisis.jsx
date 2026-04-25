import React, { useState, useMemo } from 'react'
import { Select, Empty } from './UI'
import { getMeses, mesLabel, fmtNum } from '../lib/constants'

function Rec({ nivel, titulo, children }) {
  const colors = { ok: '#52c98a', warn: '#f0b340', danger: '#f05c5c' }
  const bgs    = { ok: '#0f2a1a', warn: '#2a1f0a', danger: '#2a0f0f' }
  return (
    <div style={{
      borderLeft: `3px solid ${colors[nivel]}`,
      background: bgs[nivel],
      borderRadius: '0 10px 10px 0',
      padding: '14px 18px',
      marginBottom: 10,
    }}>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: colors[nivel], letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6 }}>{titulo}</div>
      <div style={{ fontSize: 13, color: '#ede9e1', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

export default function Analisis({ datos }) {
  const meses = useMemo(() => getMeses(datos), [datos])
  const [mes, setMes] = useState(() => meses[meses.length - 1] || '')

  if (!meses.length) return <Empty text="Sin datos. Cargá movimientos primero." />

  const movMes  = datos.filter(d => d.fecha.startsWith(mes))
  const ingresos = movMes.filter(d => d.tipo === 'ingreso').reduce((s, d) => s + Number(d.importe), 0)
  const gastos   = movMes.filter(d => d.tipo === 'gasto').reduce((s, d) => s + Number(d.importe), 0)
  const ahorro   = ingresos - gastos
  const pct      = ingresos > 0 ? Math.round(ahorro / ingresos * 100) : 0

  const porCat = {}
  movMes.filter(d => d.tipo === 'gasto').forEach(d => { porCat[d.cat] = (porCat[d.cat] || 0) + Number(d.importe) })
  const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1])

  const esenciales = ['Alimentación','Vivienda','Salud','Transporte','Servicios']
    .reduce((s, c) => s + (porCat[c] || 0), 0)
  const esencPct = ingresos > 0 ? Math.round(esenciales / ingresos * 100) : 0

  const selStyle = { background: '#151515', border: '1px solid #2a2a2a', borderRadius: 7, color: '#ede9e1', fontFamily: "'Syne',sans-serif", fontSize: 13, padding: '7px 10px', outline: 'none' }

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Análisis</h1>
          <p style={{ color: '#5a5a5a', fontSize: 13 }}>Recomendaciones financieras</p>
        </div>
        <select style={selStyle} value={mes} onChange={e => setMes(e.target.value)}>
          {meses.map(m => <option key={m} value={m}>{mesLabel(m)}</option>)}
        </select>
      </div>

      {/* Tasa de ahorro */}
      {ingresos === 0 ? (
        <Rec nivel="danger" titulo="Sin ingresos registrados">
          No hay ingresos cargados este mes. Asegurate de registrar tus fuentes de ingreso para que el análisis sea útil.
        </Rec>
      ) : pct >= 20 ? (
        <Rec nivel="ok" titulo={`Ahorro saludable · ${pct}%`}>
          Tu tasa de ahorro supera el 20% recomendado. Estás en una posición sólida. Considerá destinar el excedente a un fondo de emergencia (3–6 meses de gastos) o instrumentos de inversión.
        </Rec>
      ) : pct >= 10 ? (
        <Rec nivel="warn" titulo={`Ahorro moderado · ${pct}%`}>
          Ahorrás el {pct}% de tus ingresos. Para llegar al objetivo del 20%, necesitás incrementar el ahorro en <strong>${fmtNum(ingresos * 0.2 - ahorro)}</strong> este mes. Revisá si hay gastos no esenciales que podés reducir.
        </Rec>
      ) : (
        <Rec nivel="danger" titulo={`Ahorro bajo · ${pct}%`}>
          Tu tasa de ahorro es del {pct}%, por debajo del mínimo recomendado (10%). Sin margen de ahorro sos vulnerable a imprevistos. Revisá urgentemente tus rubros más grandes.
        </Rec>
      )}

      {/* Déficit */}
      {gastos > ingresos && ingresos > 0 && (
        <Rec nivel="danger" titulo="Déficit mensual">
          Gastás <strong>${fmtNum(gastos - ingresos)}</strong> más de lo que ingresás. Esto no es sostenible. Prioridad inmediata: identificar qué recortar o cómo aumentar ingresos.
        </Rec>
      )}

      {/* Cat dominante */}
      {cats.length > 0 && (() => {
        const [topCat, topAmt] = cats[0]
        const topPct = gastos > 0 ? Math.round(topAmt / gastos * 100) : 0
        return topPct > 40 ? (
          <Rec nivel="warn" titulo="Categoría dominante">
            <strong>{topCat}</strong> concentra el {topPct}% de tus gastos (${fmtNum(topAmt)}). Cuando un solo rubro supera el 40% del gasto total, cualquier reducción ahí tiene alto impacto.
          </Rec>
        ) : null
      })()}

      {/* No esenciales */}
      {['Entretenimiento', 'Ropa', 'Otros gastos'].map(c => {
        const amt = porCat[c] || 0
        const p = gastos > 0 ? Math.round(amt / gastos * 100) : 0
        return p > 15 ? (
          <Rec key={c} nivel="warn" titulo={`Gasto no esencial elevado · ${c}`}>
            <strong>{c}</strong> representa el {p}% de tus gastos este mes (${fmtNum(amt)}). Es un rubro prescindible: reducirlo al 10% te liberaría <strong>${fmtNum(amt - gastos * 0.1)}</strong> por mes.
          </Rec>
        ) : null
      })}

      {/* Regla 50/30/20 */}
      {ingresos > 0 && (
        <Rec nivel={esencPct > 50 ? 'warn' : 'ok'} titulo={`Regla 50/30/20 · esenciales ${esencPct}%`}>
          {esencPct > 50
            ? `Tus gastos esenciales (vivienda, alimentos, salud, transporte) son el ${esencPct}% de tus ingresos, por encima del 50% recomendado. Analizá si alguno puede optimizarse.`
            : `Tus gastos esenciales están en el ${esencPct}% de tus ingresos, dentro del rango recomendado (máx. 50%).`
          }
        </Rec>
      )}

      {/* Top rubros */}
      {cats.length >= 2 && (
        <div style={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
          <div style={{ padding: '12px 18px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5a5a5a', letterSpacing: '.07em', textTransform: 'uppercase', borderBottom: '1px solid #2a2a2a' }}>
            Desglose de gastos
          </div>
          {cats.map(([c, a]) => (
            <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid #1e1e1e' }}>
              <span style={{ fontSize: 13 }}>{c}</span>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 80, height: 4, background: '#2a2a2a', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${gastos > 0 ? Math.round(a / gastos * 100) : 0}%`, background: '#d4f060', borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#5a5a5a', minWidth: 36, textAlign: 'right' }}>
                  {gastos > 0 ? Math.round(a / gastos * 100) : 0}%
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#ede9e1', minWidth: 80, textAlign: 'right' }}>
                  ${fmtNum(a)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
