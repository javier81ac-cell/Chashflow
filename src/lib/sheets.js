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
	return data.map(d => ({ ...d, importe: Number(d.importe) }))
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
