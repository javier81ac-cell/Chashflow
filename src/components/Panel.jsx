import React, { useState, useMemo, useEffect } from 'react'
import { Doughnut, Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Filler
} from 'chart.js'
import { MetricCard, Card, Select, SectionTitle, Empty } from './UI'
import { getMeses, mesLabel, fmtNum, CAT_COLORS, CATS_GASTO, CATS_INGRESO } from '../lib/constants'
import { getDolarHistoricoMensual } from '../lib/dolar'

ChartJS.register(ArcElement, Tooltip, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler)

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
}

function fmtEje(v) {
  if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M'
  if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'k'
  return '$' + v
}

export default function Panel({ datos }) {
  const meses = useMemo(() => getMeses(datos), [datos])
  const [mes, setMes] = useState(() => meses[meses.length - 1] || '')

  const todasLasCats = useMemo(() => [...CATS_GASTO, ...CATS_INGRESO].filter(c => datos.some(d => d.cat === c)), [datos])
  const [catEvo, setCatEvo] = useState('')
  const anios = useMemo(() => [...new Set(meses.map(m => m.slice(0, 4)))].sort(), [meses])
  const [anioTorta, setAnioTorta] = useState('')

  const [dolarData, setDolarData] = useState(null)
  const [dolarError, setDolarError] = useState(false)

  useEffect(() => {
    getDolarHistoricoMensual().then(d => { if (d) setDolarData(d); else setDolarError(true) })
  }, [])

  if (!meses.length) return <Empty text="Sin datos. Cargá movimientos primero." />

  const catEvoActual = catEvo && todasLasCats.includes(catEvo) ? catEvo : (todasLasCats[0] || '')
  const anioTortaActual = anioTorta && anios.includes(anioTorta) ? anioTorta : (anios[anios.length - 1] || '')

  const movMes   = datos.filter(d => d.fecha.startsWith(mes))
  const ingresos = movMes.filter(d => d.tipo === 'ingreso').reduce((s, d) => s + Number(d.importe), 0)
  const gastos   = movMes.filter(d => d.tipo === 'gasto').reduce((s, d) => s + Number(d.importe), 0)
  const ahorro   = ingresos - gastos
  const pct      = ingresos > 0 ? Math.round(ahorro / ingresos * 100) : 0

  const porCat = {}
  movMes.filter(d => d.tipo === 'gasto').forEach(d => { porCat[d.cat] = (porCat[d.cat] || 0) + Number(d.importe) })
  const cats    = Object.keys(porCat).sort((a, b) => porCat[b] - porCat[a])
  const colores = cats.map(c => CAT_COLORS[c] || '#5a5a5a')

  const tortaData = {
    labels: cats,
    datasets: [{ data: cats.map(c => Math.round(porCat[c])), backgroundColor: colores, borderColor: '#151515', borderWidth: 2 }],
  }

  const [anio, mesNum] = mes.split('-')
  const diasEnMes = new Date(+anio, +mesNum, 0).getDate()
  const dias      = Array.from({ length: diasEnMes }, (_, i) => String(i + 1).padStart(2, '0'))
  const gstDiario = dias.map(d => Math.round(movMes.filter(m => m.tipo === 'gasto'   && m.fecha.endsWith('-' + d)).reduce((s, m) => s + Number(m.importe), 0)))
  const ingDiario = dias.map(d => Math.round(movMes.filter(m => m.tipo === 'ingreso' && m.fecha.endsWith('-' + d)).reduce((s, m) => s + Number(m.importe), 0)))

  const diarioData = {
    labels: dias,
    datasets: [
      { label: 'Gastos',   data: gstDiario, backgroundColor: '#f05c5c', borderRadius: 3 },
      { label: 'Ingresos', data: ingDiario, backgroundColor: '#52c98a', borderRadius: 3 },
    ],
  }

  const ultMeses = meses.slice(-6)
  const ingMes   = ultMeses.map(m => Math.round(datos.filter(d => d.fecha.startsWith(m) && d.tipo === 'ingreso').reduce((s, d) => s + Number(d.importe), 0)))
  const gstMes   = ultMeses.map(m => Math.round(datos.filter(d => d.fecha.startsWith(m) && d.tipo === 'gasto').reduce((s, d) => s + Number(d.importe), 0)))
  const ahoMes   = ultMeses.map((_, i) => ingMes[i] - gstMes[i])

  const evolucionData = {
    labels: ultMeses.map(mesLabel),
    datasets: [
      { label: 'Ingresos', data: ingMes, borderColor: '#52c98a', backgroundColor: 'rgba(82,201,138,.08)', borderWidth: 2, tension: .35, fill: true, pointRadius: 3, pointBackgroundColor: '#52c98a' },
      { label: 'Gastos',   data: gstMes, borderColor: '#f05c5c', backgroundColor: 'rgba(240,92,92,.08)',  borderWidth: 2, tension: .35, fill: true, pointRadius: 3, pointBackgroundColor: '#f05c5c' },
      { label: 'Ahorro',   data: ahoMes, borderColor: '#d4f060', borderWidth: 2, tension: .35, borderDash: [5, 4], pointRadius: 3, pointBackgroundColor: '#d4f060' },
    ],
  }

  const tickStyle = { color: '#5a5a5a', font: { family: "'IBM Plex Mono',monospace", size: 10 } }
  const gridStyle = { color: '#1e1e1e' }

  // Evolución mensual de una categoría elegida (puede ser de gasto o de ingreso)
  const evoCatValores = meses.map(m => Math.round(
    datos.filter(d => d.fecha.startsWith(m) && d.cat === catEvoActual).reduce((s, d) => s + Number(d.importe), 0)
  ))
  const evoCatData = {
    labels: meses.map(mesLabel),
    datasets: [{
      label: catEvoActual, data: evoCatValores,
      borderColor: CAT_COLORS[catEvoActual] || '#d4f060',
      backgroundColor: (CAT_COLORS[catEvoActual] || '#d4f060') + '15',
      borderWidth: 2, tension: .35, fill: true, pointRadius: 3,
      pointBackgroundColor: CAT_COLORS[catEvoActual] || '#d4f060',
    }],
  }

  // Total anual por categoría (torta) para el año elegido
  const movAnio = datos.filter(d => d.fecha.startsWith(anioTortaActual) && d.tipo === 'gasto')
  const porCatAnio = {}
  movAnio.forEach(d => { porCatAnio[d.cat] = (porCatAnio[d.cat] || 0) + Number(d.importe) })
  const catsAnio = Object.keys(porCatAnio).sort((a, b) => porCatAnio[b] - porCatAnio[a])
  const tortaAnualData = {
    labels: catsAnio,
    datasets: [{ data: catsAnio.map(c => Math.round(porCatAnio[c])), backgroundColor: catsAnio.map(c => CAT_COLORS[c] || '#5a5a5a'), borderColor: '#151515', borderWidth: 2 }],
  }
  const totalGastadoAnio = catsAnio.reduce((s, c) => s + porCatAnio[c], 0)

  // Pesos vs. cotización del dólar — últimos 12 meses con datos
  const mesesDolar = meses.slice(-12)
  const gastosDolarMes = mesesDolar.map(m => Math.round(datos.filter(d => d.fecha.startsWith(m) && d.tipo === 'gasto').reduce((s, d) => s + Number(d.importe), 0)))
  const oficialMes = mesesDolar.map(m => dolarData?.[m]?.oficial ?? null)
  const blueMes    = mesesDolar.map(m => dolarData?.[m]?.blue ?? null)
  const dolarComparisonData = {
    labels: mesesDolar.map(mesLabel),
    datasets: [
      { label: 'Gastos (ARS)', data: gastosDolarMes, borderColor: '#ede9e1', backgroundColor: 'rgba(237,233,225,.06)', borderWidth: 2, tension: .3, fill: true, pointRadius: 2, yAxisID: 'y' },
      { label: 'Dólar oficial', data: oficialMes, borderColor: '#378ADD', borderWidth: 2, tension: .3, pointRadius: 2, yAxisID: 'y1', spanGaps: true },
      { label: 'Dólar blue', data: blueMes, borderColor: '#f0b340', borderWidth: 2, tension: .3, pointRadius: 2, yAxisID: 'y1', spanGaps: true },
    ],
  }

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Panel</h1>
          <p style={{ color: '#5a5a5a', fontSize: 13 }}>Resumen financiero</p>
        </div>
        <Select value={mes} onChange={e => setMes(e.target.value)} style={{ width: 'auto' }}>
          {meses.map(m => <option key={m} value={m}>{mesLabel(m)}</option>)}
        </Select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        <MetricCard label="Ingresos"    value={`$${fmtNum(ingresos)}`} color="green" />
        <MetricCard label="Gastos"      value={`$${fmtNum(gastos)}`}   color="red" />
        <MetricCard label="Ahorro"      value={`$${fmtNum(ahorro)}`}   color={ahorro >= 0 ? 'green' : 'red'} />
        <MetricCard label="Tasa ahorro" value={`${pct}%`} sub="meta: 20%" color={pct >= 20 ? 'accent' : pct >= 10 ? 'green' : 'red'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card>
          <SectionTitle>Gastos por categoría</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {cats.map((c, i) => (
              <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#5a5a5a', fontFamily: "'IBM Plex Mono',monospace" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: colores[i], flexShrink: 0 }} />
                {c.split(' ')[0]} {gastos > 0 ? Math.round(porCat[c] / gastos * 100) : 0}%
              </span>
            ))}
          </div>
          <div style={{ position: 'relative', height: 210 }}>
            {cats.length
              ? <Doughnut data={tortaData} options={{ ...CHART_DEFAULTS, cutout: '62%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `$${fmtNum(ctx.raw)}` } } } }} />
              : <Empty text="Sin gastos este mes" />
            }
          </div>
        </Card>

        <Card>
          <SectionTitle>Movimientos diarios</SectionTitle>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {[['#f05c5c','Gastos'],['#52c98a','Ingresos']].map(([c,l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#5a5a5a', fontFamily: "'IBM Plex Mono',monospace" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
              </span>
            ))}
          </div>
          <div style={{ position: 'relative', height: 210 }}>
            <Bar data={diarioData} options={{
              ...CHART_DEFAULTS,
              scales: {
                x: { ticks: { ...tickStyle, maxTicksLimit: 8, autoSkip: true }, grid: { color: gridStyle.color } },
                y: { ticks: { ...tickStyle, callback: v => { if (v >= 1000000) return '$' + (v/1000000).toFixed(1) + 'M'; if (v >= 1000) return '$' + (v/1000).toFixed(0) + 'k'; return '$' + v; } }, grid: { color: gridStyle.color } }
              },
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `$${fmtNum(ctx.raw)}` } } },
            }} />
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle>Evolución mensual</SectionTitle>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {[['#52c98a','Ingresos'],['#f05c5c','Gastos'],['#d4f060','Ahorro']].map(([c,l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#5a5a5a', fontFamily: "'IBM Plex Mono',monospace" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
            </span>
          ))}
        </div>
        <div style={{ position: 'relative', height: 200 }}>
          <Line data={evolucionData} options={{
            ...CHART_DEFAULTS,
            scales: {
              x: { ticks: tickStyle, grid: { color: gridStyle.color } },
              y: { ticks: { ...tickStyle, callback: v => { if (v >= 1000000) return '$' + (v/1000000).toFixed(1) + 'M'; if (v >= 1000) return '$' + (v/1000).toFixed(0) + 'k'; return '$' + v; } }, grid: { color: gridStyle.color } }
            },
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: $${fmtNum(ctx.raw)}` } } },
          }} />
        </div>
      </Card>

      {/* Evolución por categoría + Torta anual */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 }}>
            <SectionTitle>Evolución por categoría</SectionTitle>
            <Select value={catEvoActual} onChange={e => setCatEvo(e.target.value)} style={{ width: 'auto', fontSize: 12 }}>
              {todasLasCats.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div style={{ position: 'relative', height: 210 }}>
            {todasLasCats.length
              ? <Line data={evoCatData} options={{
                  ...CHART_DEFAULTS,
                  scales: {
                    x: { ticks: { ...tickStyle, maxTicksLimit: 8, autoSkip: true }, grid: { color: gridStyle.color } },
                    y: { ticks: { ...tickStyle, callback: fmtEje }, grid: { color: gridStyle.color } },
                  },
                  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `$${fmtNum(ctx.raw)}` } } },
                }} />
              : <Empty text="Sin categorías con movimientos" />
            }
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 }}>
            <SectionTitle>Total anual por categoría</SectionTitle>
            <Select value={anioTortaActual} onChange={e => setAnioTorta(e.target.value)} style={{ width: 'auto', fontSize: 12 }}>
              {anios.map(a => <option key={a} value={a}>{a}</option>)}
            </Select>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {catsAnio.map((c, i) => (
              <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#5a5a5a', fontFamily: "'IBM Plex Mono',monospace" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[c] || '#5a5a5a', flexShrink: 0 }} />
                {c.split(' ')[0]} {totalGastadoAnio > 0 ? Math.round(porCatAnio[c] / totalGastadoAnio * 100) : 0}%
              </span>
            ))}
          </div>
          <div style={{ position: 'relative', height: 210 }}>
            {catsAnio.length
              ? <Doughnut data={tortaAnualData} options={{ ...CHART_DEFAULTS, cutout: '62%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `$${fmtNum(ctx.raw)}` } } } }} />
              : <Empty text={`Sin gastos en ${anioTortaActual}`} />
            }
          </div>
        </Card>
      </div>

      {/* Pesos vs. cotización del dólar */}
      <Card style={{ marginTop: 14 }}>
        <SectionTitle>Pesos vs. cotización del dólar</SectionTitle>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          {[['#ede9e1','Gastos (ARS)'],['#378ADD','Dólar oficial'],['#f0b340','Dólar blue']].map(([c,l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#5a5a5a', fontFamily: "'IBM Plex Mono',monospace" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
            </span>
          ))}
        </div>
        <div style={{ position: 'relative', height: 220 }}>
          {dolarError ? (
            <Empty text="No se pudo cargar la cotización del dólar. Probá de nuevo más tarde." />
          ) : (
            <Line data={dolarComparisonData} options={{
              ...CHART_DEFAULTS,
              interaction: { mode: 'index', intersect: false },
              scales: {
                x: { ticks: tickStyle, grid: { color: gridStyle.color } },
                y:  { position: 'left',  ticks: { ...tickStyle, callback: fmtEje }, grid: { color: gridStyle.color }, title: { display: true, text: 'Gastos (ARS)', color: '#5a5a5a', font: { size: 10 } } },
                y1: { position: 'right', ticks: { ...tickStyle, callback: v => '$' + v }, grid: { drawOnChartArea: false }, title: { display: true, text: 'Dólar ($/USD)', color: '#5a5a5a', font: { size: 10 } } },
              },
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: $${fmtNum(ctx.raw)}` } },
              },
            }} />
          )}
        </div>
        <p style={{ fontSize: 11, color: '#3a3a3a', marginTop: 10, lineHeight: 1.5 }}>
          Cotización de venta a fin de cada mes · fuente: <a href="https://argentinadatos.com" target="_blank" rel="noreferrer" style={{ color: '#5a5a5a' }}>ArgentinaDatos</a>
        </p>
      </Card>
    </div>
  )
}
