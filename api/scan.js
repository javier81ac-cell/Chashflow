export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido' })

  try {
    const { imageBase64, mediaType } = req.body
    if (!imageBase64) return res.status(400).json({ ok: false, error: 'Imagen requerida' })

    const apiKey = process.env.ANTHROPIC_KEY
    if (!apiKey) return res.status(500).json({ ok: false, error: 'API key no configurada' })

    const prompt = `Analizá esta imagen de un ticket, factura o resumen de tarjeta de crédito.
Extraé TODOS los movimientos o items que veas y devolvé ÚNICAMENTE un array JSON válido, sin texto adicional ni markdown.

Formato exacto:
[
  {"fecha":"YYYY-MM-DD","importe":1234.56,"descripcion":"nombre del comercio o concepto","categoria":"Alimentación","tipo":"gasto"},
  {"fecha":"YYYY-MM-DD","importe":500.00,"descripcion":"otro concepto","categoria":"Transporte","tipo":"gasto"}
]

Categorías válidas: Alimentación, Transporte, Vivienda, Salud, Educación, Entretenimiento, Ropa, Servicios, Otros gastos

Reglas:
- Incluí TODOS los movimientos visibles, uno por línea del resumen
- fecha en formato YYYY-MM-DD
- importe como número positivo sin símbolos ni puntos de miles, solo punto decimal
- descripcion: el nombre del comercio o concepto, limpio y legible
- categoria: elegí la más apropiada según el comercio
- tipo: siempre "gasto" salvo que sea claramente un ingreso o pago
- Si no se ve la fecha de algún item, usá la fecha más cercana visible
- Respondé SOLO el array JSON, sin explicaciones`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    })

    const result = await response.json()
    if (result.error) return res.status(500).json({ ok: false, error: result.error.message })

    const texto = result.content[0].text.trim()
    const limpio = texto.replace(/```json|```/g, '').trim()
    const match = limpio.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No se encontró array JSON en la respuesta')
    const movimientos = JSON.parse(match[0])
    if (!Array.isArray(movimientos)) throw new Error('La respuesta no es un array')

    return res.status(200).json({ ok: true, movimientos })

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}
