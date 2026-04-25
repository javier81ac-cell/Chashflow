# Mis Finanzas 💰

App personal de finanzas con **Vite + React**, Google Sheets como base de datos, y deploy en **GitHub Pages**.

## Stack

- Frontend: React 18 + Vite
- Gráficos: Chart.js + react-chartjs-2
- Datos: Google Sheets via Apps Script (o localStorage offline)
- Hosting: GitHub Pages (deploy automático con GitHub Actions)

---

## 1. Correr localmente

```bash
npm install
npm run dev
```

Abre http://localhost:5173

---

## 2. Configurar para tu repositorio

Antes de subir a GitHub, abrí `vite.config.js` y cambiá `mis-finanzas` por el nombre exacto de tu repo:

```js
base: '/NOMBRE-DE-TU-REPO/',
```

---

## 3. Deploy en GitHub Pages

### 3a. Subir a GitHub

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/NOMBRE-DE-TU-REPO.git
git push -u origin main
```

### 3b. Activar GitHub Pages con Actions

1. En tu repositorio → **Settings → Pages**
2. En "Source" elegir: **GitHub Actions**
3. Guardar

Al hacer cualquier `git push` a `main`, el workflow `.github/workflows/deploy.yml` buildea y publica automáticamente.

Tu app queda en: `https://TU_USUARIO.github.io/NOMBRE-DE-TU-REPO/`

---

## 4. Conectar Google Sheets (opcional pero recomendado)

### 4a. Crear la hoja

1. Nueva hoja en https://sheets.google.com
2. Renombrar la pestaña como `Movimientos`
3. Encabezados en fila 1 (A1:F1):

```
id | fecha | tipo | cat | importe | desc
```

4. Copiar el **Sheet ID** de la URL: `.../spreadsheets/d/ESTE_ID/edit`

### 4b. Apps Script

1. **Extensiones → Apps Script** en tu Sheet
2. Pegar el contenido de `apps-script.gs`
3. Reemplazar `TU_SHEET_ID_AQUI` con el ID copiado
4. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier usuario**
5. Copiar la URL del deploy

### 4c. Conectar en la app

Ir a la sección **Config** → pegar la URL → **Guardar y conectar**.

---

## Estructura

```
misfinanzas/
├── .github/workflows/deploy.yml   ← deploy automático
├── index.html
├── vite.config.js                 ← base: '/nombre-repo/'
├── package.json
├── apps-script.gs                 ← backend Google Sheets
└── src/
    ├── App.jsx
    ├── index.css
    ├── lib/
    │   ├── sheets.js
    │   └── constants.js
    ├── hooks/useDatos.js
    └── components/
        ├── UI.jsx
        ├── Cargar.jsx
        ├── Panel.jsx
        ├── Movimientos.jsx
        ├── Analisis.jsx
        └── Config.jsx
```
