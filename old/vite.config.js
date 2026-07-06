import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Reemplazá 'mis-finanzas' con el nombre exacto de tu repositorio en GitHub
export default defineConfig({
  plugins: [react()],
  base: '/',
})
