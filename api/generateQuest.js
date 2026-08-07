export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, goal, progress, timeline, commitment } = req.body;

    if (!apiKey || !goal || !progress || !timeline || !commitment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [{
          role: 'user',
          content: `Generate a quest breakdown for this goal:
              
Goal: ${goal}
Current Progress: ${progress}
Timeline: ${timeline}
Commitment: ${commitment}

Return ONLY valid JSON (no markdown):
{
  "skillsets": [{"name": "Skill", "description": "desc"}],
  "habits": [{"name": "Habit", "description": "desc", "daysPerWeek": 5}],
  "dailyObjectives": [{"title": "Task", "description": "desc", "duration": "30 mins"}],
  "milestones": [{"name": "Milestone", "description": "desc", "targetDate": "week 4"}],
  "affirmation": "Affirmation",
  "quote": "Quote"
}`
        }],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'NVIDIA API error' 
      });
    }

    if (!data.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: 'Invalid response format' });
    }

    let content = data.choices[0].message.content.trim();
    if (content.startsWith('```')) {
      content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    return res.status(200).json({
      success: true,
      content: content
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Server error' 
    });
  }
}
