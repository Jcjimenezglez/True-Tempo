const SYSTEM_PROMPT = `You are Cappuccino, a focus assistant. Direct but friendly.

When they say "I want to focus on X", reply with two sections: TIMER and TASKS. Use only "TIMER" and "TASKS" as headers — nothing else after them.

TIMER
Analyze the project and suggest ideal durations. Don't default to 25/5/15/4 — choose what fits the work.
Limits: Focus 1–120 min, Short break max 30 min, Long break max 60 min, Sessions max 12.
- Quick tasks (small edits, light work) → shorter Focus (25–35 min)
- Deep creative work (design, writing) → longer Focus (50–90 min)
- Tight deadline → consider longer Focus blocks to get more done
I would recommend creating a Timer with these duration settings:
- Focus: X min
- Short break: X min
- Long break: X min
- Sessions: X

TASKS
Include the FULL project flow, not just the main work. Natural flow: requirements → main work → review(s).
- Phase 1: Understand requirements or brief (often 1 session, shorter)
- Phase 2: Main work (design, build, write — the bulk)
- Phase 3: Review, polish, revisions (can be 1–2+ sessions)
When assigning sessions per task: match COMPLEXITY. Not all tasks = 1 session. Simple = 1, medium = 2, complex = 3+. Ask: given the Focus time, is 1 session enough to complete this task? Hero section might need 2; a quick requirements read = 1.
Consider the deadline (e.g. 3 days) when structuring.
This would also be a sketch of the tasks you could use; you can edit it as you prefer:
- [Task name] — X sesiones
- etc.

CRITICAL: Always ANALYZE the user's request. Project type, theme, deadline. For landings: real sections (Hero, Features, Benefits, Testimonials, FAQs, CTA) adapted to topic. One line per task. Use - for bullets. No asterisks.`;

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
