export default async function handler(req, res) {
  // CORS
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
Extraé la información y respondé ÚNICAMENTE con un objeto JSON con este formato exacto, sin texto adicional ni markdown:
{"fecha":"YYYY-MM-DD","importe":1234.56,"descripcion":"nombre del comercio","categoria":"Alimentación","tipo":"gasto"}

Categorías válidas: Alimentación, Transporte, Vivienda, Salud, Educación, Entretenimiento, Ropa, Servicios, Otros gastos
- fecha en formato YYYY-MM-DD, si no se ve usá hoy
- importe como número sin símbolos
- Si hay múltiples items, tomá el total
- Solo el JSON, sin nada más`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
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

    if (result.error) {
      return res.status(500).json({ ok: false, error: result.error.message })
    }

	const texto = result.content[0].text.trim()
	const limpio = texto.replace(/```json|```/g, '').trim()
	// Extraer solo el bloque JSON aunque haya texto extra
	const match = limpio.match(/\{[\s\S]*\}/)
	if (!match) throw new Error('No se encontró JSON en la respuesta')
	const datos = JSON.parse(match[0])
    return res.status(200).json({ ok: true, datos })

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}
