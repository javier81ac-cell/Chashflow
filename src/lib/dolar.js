// Cotización histórica del dólar (oficial y blue) para Argentina.
// Fuente: ArgentinaDatos (https://argentinadatos.com) — API pública y gratuita.
// Se cachea en localStorage por 24hs para no pegarle a la API en cada carga de la app.

const CACHE_KEY = 'mf_dolar_historico_v1'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 1 día
const API_URL = 'https://api.argentinadatos.com/v1/cotizaciones/dolares'

// Devuelve { 'YYYY-MM': { oficial: number|null, blue: number|null } } — el valor de
// venta del último día con dato disponible de cada mes. null si falla la carga.
export async function getDolarHistoricoMensual() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS && cached.data) return cached.data
  } catch { /* cache corrupto, seguimos a buscar de nuevo */ }

  try {
    const r = await fetch(API_URL)
    if (!r.ok) throw new Error('respuesta no ok')
    const raw = await r.json()
    const porMes = {}
    raw.forEach(item => {
      if (item.casa !== 'oficial' && item.casa !== 'blue') return
      if (!item.fecha || item.venta == null) return
      const mes = item.fecha.slice(0, 7)
      if (!porMes[mes]) porMes[mes] = { oficial: null, blue: null }
      // Los datos vienen ordenados por fecha ascendente, así que el último que
      // pisamos es el valor más reciente disponible dentro de ese mes.
      porMes[mes][item.casa] = item.venta
    })
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: porMes }))
    return porMes
  } catch {
    return null
  }
}
