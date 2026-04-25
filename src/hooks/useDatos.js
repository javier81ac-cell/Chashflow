import { useState, useEffect, useCallback } from 'react'
import { sheetGet, sheetAdd, sheetDelete } from '../lib/sheets'

const LOCAL_KEY = 'mf_datos_v2'

function load() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}

function save(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

export function useDatos() {
  const [datos, setDatos] = useState(load)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)

  const persist = useCallback((next) => {
    setDatos(next)
    save(next)
  }, [])

  const sync = useCallback(async () => {
    setSyncing(true)
    setError(null)
    const remote = await sheetGet()
    if (remote) persist(remote)
    else setError('Sin conexión con Google Sheets')
    setSyncing(false)
  }, [persist])

  useEffect(() => { sync() }, []) // eslint-disable-line

  const agregar = useCallback(async (mov) => {
    const apiUrl = localStorage.getItem('mf_api_url')
    if (apiUrl) {
      const ok = await sheetAdd(mov)
      if (!ok) throw new Error('Error al guardar en Google Sheets')
      await sync()
    } else {
      persist([...datos, mov])
    }
  }, [datos, persist, sync])

  const eliminar = useCallback(async (id) => {
    const apiUrl = localStorage.getItem('mf_api_url')
    if (apiUrl) {
      await sheetDelete(id)
      await sync()
    } else {
      persist(datos.filter(d => d.id !== id))
    }
  }, [datos, persist, sync])

  const importar = useCallback((nuevos) => {
    persist(nuevos)
  }, [persist])

  return { datos, syncing, error, sync, agregar, eliminar, importar }
}
