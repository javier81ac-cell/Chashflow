import { useState, useEffect, useCallback } from 'react'
import {
  serviciosGet, servicioAdd, servicioUpdate, servicioDelete,
  serviciosConfigGet, serviciosConfigSet, serviciosAvisarAhora, getApiUrl,
} from '../lib/sheets'

const LOCAL_KEY = 'mf_servicios_v1'
const CFG_KEY   = 'mf_servicios_cfg_v1'

function load() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}
function save(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}
function loadCfg() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}') } catch { return {} }
}
function saveCfg(c) {
  localStorage.setItem(CFG_KEY, JSON.stringify(c))
}

export function useServicios() {
  const [servicios, setServicios] = useState(load)
  const [config, setConfig] = useState(() => ({ telefono: '', apikey: '', diasAviso: 3, ...loadCfg() }))
  const [syncing, setSyncing] = useState(false)

  const persist = useCallback((next) => { setServicios(next); save(next) }, [])
  const persistCfg = useCallback((next) => { setConfig(next); saveCfg(next) }, [])

  const sync = useCallback(async () => {
    if (!getApiUrl()) return
    setSyncing(true)
    const remote = await serviciosGet()
    if (remote) persist(remote)
    const remoteCfg = await serviciosConfigGet()
    if (remoteCfg) persistCfg({ telefono: '', apikey: '', diasAviso: 3, ...remoteCfg })
    setSyncing(false)
  }, [persist, persistCfg])

  useEffect(() => { sync() }, []) // eslint-disable-line

  const agregar = useCallback(async (servicio) => {
    if (getApiUrl()) {
      const ok = await servicioAdd(servicio)
      if (!ok) throw new Error('Error al guardar el servicio en Google Sheets')
      await sync()
    } else {
      persist([...servicios, { ...servicio, activo: true, ultimoAvisoPara: '' }])
    }
  }, [servicios, persist, sync])

  const editar = useCallback(async (servicio) => {
    if (getApiUrl()) {
      const ok = await servicioUpdate(servicio)
      if (!ok) throw new Error('Error al actualizar el servicio en Google Sheets')
      await sync()
    } else {
      persist(servicios.map(s => s.id === servicio.id ? { ...s, ...servicio } : s))
    }
  }, [servicios, persist, sync])

  const eliminar = useCallback(async (id) => {
    if (getApiUrl()) {
      await servicioDelete(id)
      await sync()
    } else {
      persist(servicios.filter(s => s.id !== id))
    }
  }, [servicios, persist, sync])

  const guardarConfig = useCallback(async (next) => {
    const merged = { ...config, ...next }
    if (getApiUrl()) {
      const ok = await serviciosConfigSet(merged)
      if (!ok) throw new Error('Error al guardar la configuración en Google Sheets')
    }
    persistCfg(merged)
  }, [config, persistCfg])

  const avisarAhora = useCallback(async () => {
    if (!getApiUrl()) throw new Error('Conectá Google Sheets en Config para poder enviar avisos.')
    const resultado = await serviciosAvisarAhora()
    if (resultado === null) throw new Error('No se pudo contactar al servidor. Revisá tu conexión.')
    return resultado
  }, [])

  return { servicios, config, syncing, sync, agregar, editar, eliminar, guardarConfig, avisarAhora }
}
