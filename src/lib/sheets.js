const API_URL_KEY = 'mf_api_url'

export function getApiUrl() {
  return localStorage.getItem(API_URL_KEY) || ''
}

export function saveApiUrl(url) {
  localStorage.setItem(API_URL_KEY, url)
}

export async function sheetGet() {
  const url = getApiUrl()
  if (!url) return null
  try {
    const r = await fetch(`${url}?action=get`)
    const j = await r.json()
    const data = j.data || []
	return data.map(d => ({
	  ...d,
	  importe: Number(d.importe),
	  fecha: String(d.fecha).slice(0, 10)
	}))

  } catch {
    return null
  }
}

export async function sheetAdd(mov) {
  const url = getApiUrl()
  if (!url) return false
  try {
    const r = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'add', row: mov }),
    })
    const j = await r.json()
    return j.ok === true
  } catch {
    return false
  }
}

export async function sheetDelete(id) {
  const url = getApiUrl()
  if (!url) return false
  try {
    const r = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id }),
    })
    const j = await r.json()
    return j.ok === true
  } catch {
    return false
  }
}

export async function sheetUpdate(mov) {
  const url = getApiUrl()
  if (!url) return false
  try {
    const r = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'update', row: mov }),
    })
    const j = await r.json()
    return j.ok === true
  } catch {
    return false
  }
}

export async function presupuestosGet() {
  const url = getApiUrl()
  if (!url) return null
  try {
    const r = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'getPresupuestos' }),
    })
    const j = await r.json()
    return j.ok ? (j.data || {}) : null
  } catch {
    return null
  }
}

export async function presupuestosSet(presupuestos) {
  const url = getApiUrl()
  if (!url) return false
  try {
    const r = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'setPresupuestos', presupuestos }),
    })
    const j = await r.json()
    return j.ok === true
  } catch {
    return false
  }
}

// ── Servicios (vencimientos + aviso WhatsApp) ──

export async function serviciosGet() {
  const url = getApiUrl()
  if (!url) return null
  try {
    const r = await fetch(`${url}?action=getServicios`)
    const j = await r.json()
    return j.ok ? (j.data || []) : null
  } catch {
    return null
  }
}

export async function servicioAdd(servicio) {
  const url = getApiUrl()
  if (!url) return false
  try {
    const r = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'addServicio', row: servicio }),
    })
    const j = await r.json()
    return j.ok === true
  } catch {
    return false
  }
}

export async function servicioUpdate(servicio) {
  const url = getApiUrl()
  if (!url) return false
  try {
    const r = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'updateServicio', row: servicio }),
    })
    const j = await r.json()
    return j.ok === true
  } catch {
    return false
  }
}

export async function servicioDelete(id) {
  const url = getApiUrl()
  if (!url) return false
  try {
    const r = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteServicio', id }),
    })
    const j = await r.json()
    return j.ok === true
  } catch {
    return false
  }
}

export async function serviciosConfigGet() {
  const url = getApiUrl()
  if (!url) return null
  try {
    const r = await fetch(`${url}?action=getServiciosConfig`)
    const j = await r.json()
    return j.ok ? j.data : null
  } catch {
    return null
  }
}

export async function serviciosConfigSet(config) {
  const url = getApiUrl()
  if (!url) return false
  try {
    const r = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'setServiciosConfig', config }),
    })
    const j = await r.json()
    return j.ok === true
  } catch {
    return false
  }
}

export async function serviciosAvisarAhora() {
  const url = getApiUrl()
  if (!url) return null
  try {
    const r = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'avisarAhora' }),
    })
    const j = await r.json()
    return j.ok ? j.enviados : null
  } catch {
    return null
  }
}
