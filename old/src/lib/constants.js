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
