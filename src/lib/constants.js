export const CATS_GASTO = [
  'Alimentación', 'Transporte', 'Vivienda', 'Salud',
  'Educación', 'Entretenimiento', 'Ropa', 'Servicios',
  'Ahorros / inversión', 'Otros gastos',
]

export const CATS_INGRESO = [
  'Sueldo', 'Freelance', 'Inversiones', 'Otros ingresos',
]

export const CAT_COLORS = {
  'Alimentación':       '#378ADD',
  'Transporte':         '#1D9E75',
  'Vivienda':           '#D85A30',
  'Salud':              '#D4537E',
  'Educación':          '#7F77DD',
  'Entretenimiento':    '#BA7517',
  'Ropa':               '#534AB7',
  'Servicios':          '#0F6E56',
  'Ahorros / inversión':'#d4f060',
  'Otros gastos':       '#5a5a5a',
  'Sueldo':             '#52c98a',
  'Freelance':          '#3B6D11',
  'Inversiones':        '#5DCAA5',
  'Otros ingresos':     '#9FE1CB',
}

export const MES_NOMBRES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export function fmtNum(n) {
  return Math.round(Number(n)).toLocaleString('es-AR')
}

export function mesLabel(m) {
  const [y, mo] = m.split('-')
  return MES_NOMBRES[parseInt(mo) - 1] + ' ' + y
}

export function getMeses(datos) {
  return [...new Set(datos.map(d => d.fecha.slice(0, 7)))].sort()
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

// Formatea cualquier fecha (ISO 'yyyy-MM-dd' u otro formato que llegue del backend)
// como 'DD-MM-YYYY' para mostrar en pantalla. El dato se sigue guardando/ordenando
// internamente en ISO — esto es solo para visualización.
export function fmtFecha(fecha) {
  const d = parseFechaFlexible(fecha)
  if (isNaN(d.getTime())) return String(fecha || '')
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
}

// Convierte cualquier string de fecha (ISO 'yyyy-MM-dd', o el formato largo que da
// String(objetoDate) en Apps Script si algo quedó mal guardado) a un Date real.
// Nunca devuelve Invalid Date: si no puede parsear nada, cae en la fecha de hoy.
export function parseFechaFlexible(fecha) {
  if (!fecha) return new Date(NaN)
  const esIso = /^\d{4}-\d{2}-\d{2}$/.test(String(fecha).trim())
  const d = esIso ? new Date(fecha + 'T00:00:00') : new Date(fecha)
  return d
}

// Versión "para mostrar": siempre devuelve 'yyyy-MM-dd' prolijo, sea cual sea el
// formato que vino del backend (evita que se vea "Wed Jul 08" en la tabla).
export function normalizarFechaDisplay(fecha) {
  const d = parseFechaFlexible(fecha)
  if (isNaN(d.getTime())) return String(fecha || '')
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
