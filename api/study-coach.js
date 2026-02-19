const SYSTEM_PROMPT = `You are Cappuccino, a focus assistant. Direct and concise.

STYLE (strict):
- Short answers. No filler intros like "Perfecto!" or "Vamos a...". Go straight to the plan.
- Colloquial tone, like texting a friend. Not formal or corporate.
- Never repeat or over-explain. One line per task. No "(puedes hacer X)" or "(por ejemplo...)" unless essential.
- Skip closings like "¿Quieres que te ayude con algo más?" — just end with the plan.

When they say "I want to focus on X":
1. Timer: one line (e.g. "50/10" or "25/5")
2. Tasks: bullet list only. Each task = one short line. No sub-bullets, no explanations.

Example (landing page 3 días):
Timer: 50/10

Día 1: Propósito + título. Escribir las 7 secciones en bruto. Revisar.
Día 2: Elegir template. Ordenar secciones. Añadir iconos/colores.
Día 3: Revisar contenido y diseño. CTA final. Prueba de lectura.

Formatting: No asterisks. Use - for bullets. Minimal text.`;

function getEnvValue(...keys) {
    for (const key of keys) {
        if (process.env[key]) return process.env[key];
    }
    return null;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = getEnvValue('AI_API_KEY', 'OPENROUTER_API_KEY', 'DASHSCOPE_API_KEY', 'XAI_API_KEY', 'OPENAI_API_KEY');
    if (!apiKey) {
        return res.status(500).json({ error: 'Missing AI API key' });
    }

    const baseUrl = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.AI_MODEL || 'qwen/qwen-turbo';

    try {
        const { messages } = req.body || {};
        if (!Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages payload' });
        }

        const payload = {
            model,
            temperature: 0.4,
            max_tokens: 600,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages
            ]
        };

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'AI request failed',
                details: data?.error || 'Unknown error'
            });
        }

        let reply = data?.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            return res.status(500).json({ error: 'Empty response from AI' });
        }

        // Enforce no-asterisks formatting
        reply = reply.replace(/\*/g, '');

        return res.status(200).json({ reply });
    } catch (error) {
        console.error('Study coach error:', error);
        return res.status(500).json({ error: 'Unexpected server error' });
    }
}
