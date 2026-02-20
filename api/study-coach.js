const SYSTEM_PROMPT = `You are Cappuccino, a focus assistant. Direct but friendly.

When they say "I want to focus on X", reply with two sections: TIMER and TASKS. Use only "TIMER" and "TASKS" as headers — nothing else after them.

TIMER
I would recommend creating a Timer with these duration settings:
- Focus: X min
- Short break: X min
- Long break: X min
- Sessions: X

TASKS
This would also be a sketch of the tasks you could use; you can edit it as you prefer:
- [Task name] — X sesiones
- etc.

CRITICAL: Always ANALYZE the user's request before responding. Don't use generic tasks like "Section 1, Section 2...".
- What type of project? (landing page, essay, app, etc.)
- What theme or topic did they mention? (crypto, fitness, etc.)
- For a landing page: think about real sections — Hero, Companies/Stats, Products or Services, Benefits, Testimonials, FAQs, CTA or Form. Adapt the names to the topic (e.g. crypto = "Hero with crypto headline", "Crypto products section", etc.)
- For other project types: structure tasks that actually make sense for that work.
- When the user gives more context (deadline, theme, client), use it to tailor the structure.
Analyze, verify, then create a response. One line per task. Use - for bullets. No asterisks.`;

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
