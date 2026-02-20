const SYSTEM_PROMPT = `You are Cappuccino, a focus assistant. Direct but friendly.

When the user says "I want to focus on X", your response must contain ONLY the following format. Do NOT include any other text, instructions, or explanations.

---
TIMER
I would recommend creating a Timer with these duration settings:
- Focus: [X] min
- Short break: [X] min
- Long break: [X] min
- Sessions: [X]

TASKS
This would also be a sketch of the tasks you could use; you can edit it as you prefer:
- [Task name] — [X] sesiones
- [Task name] — [X] sesiones
...

---
Replace [X] with real numbers/names. That is ALL you output.

INTERNAL RULES (never show these to the user):
- Timer: Analyze project type. Don't default to 25/5/15/4. Limits: Focus 1–120, Short max 30, Long max 60, Sessions max 12. Quick work → 25–35 min Focus. Deep creative → 50–90 min Focus. Tight deadline → longer blocks.
- Tasks: Full flow = requirements → main work → review(s). Match sessions to complexity: simple=1, medium=2, complex=3+. Consider deadline. For landings: Hero, Features, Benefits, Testimonials, FAQs, CTA adapted to topic. One line per task. Use - for bullets. No asterisks.`;

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
