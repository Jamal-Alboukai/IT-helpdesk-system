// ─── Groq API service ─────────────────────────────────────────
// Uses llama-3.3-70b — completely free, no region restrictions
// Docs: https://console.groq.com/docs/api-reference

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Types ────────────────────────────────────────────────────
export interface AISuggestion {
  categoryName: string;
  priorityName: string;
  reason: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Helper: call Groq ────────────────────────────────────────
async function callGroq(
  messages: { role: string; content: string }[]
): Promise<string> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.2,
      max_tokens: 512,
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      err?.error?.message || 'Groq API error');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── AI Suggest: category + priority ─────────────────────────
export async function suggestCategoryAndPriority(
  title: string,
  description: string,
  categories: string[],
  priorities: string[]
): Promise<AISuggestion> {

  const messages = [
    {
      role: 'system',
      content:
        'You are an IT Help Desk assistant. ' +
        'You analyze support tickets and suggest categories and priorities. ' +
        'You ONLY respond with valid JSON, no markdown, no explanation.'
    },
    {
      role: 'user',
      content: `
Analyze this IT support ticket and suggest the best category and priority.

Ticket Title: ${title}
Ticket Description: ${description}

Available Categories: ${categories.join(', ')}
Available Priorities: ${priorities.join(', ')}

Priority guidelines:
- Critical: system down, data loss, security breach, entire team blocked
- High: major feature broken, significant productivity impact
- Medium: issue affects work but workaround exists
- Low: minor issue, cosmetic, or nice-to-have

Respond ONLY with this exact JSON format, no markdown fences:
{
  "categoryName": "<one of the available categories>",
  "priorityName": "<one of the available priorities>",
  "reason": "<one sentence explaining why>"
}
`.trim()
    }
  ];

  const raw = await callGroq(messages);

  // Strip markdown fences if model adds them
  const clean = raw
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  try {
    const parsed = JSON.parse(clean);

    const validCategory = categories.find(
      c => c.toLowerCase() === parsed.categoryName?.toLowerCase()
    );
    const validPriority = priorities.find(
      p => p.toLowerCase() === parsed.priorityName?.toLowerCase()
    );

    return {
      categoryName: validCategory || categories[0],
      priorityName: validPriority || priorities[1],
      reason: parsed.reason || 'Based on ticket content.'
    };
  } catch {
    throw new Error(
      'AI returned an unexpected response. Please try again.');
  }
}

// ─── AI Chat ──────────────────────────────────────────────────
export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<string> {

  const messages = [
    {
      role: 'system',
      content:
        'You are an IT Help Desk assistant for IDS (Integrated Digital Systems). ' +
        'You help employees with IT support questions. ' +
        'You can help with: network issues, software problems, hardware issues, ' +
        'email problems, access requests, password resets, VPN, and general IT troubleshooting. ' +
        'Keep answers concise, friendly, and practical. ' +
        'If you cannot help, suggest submitting a support ticket. ' +
        'Never make up ticket data or user information.'
    },
    // Include last 6 messages for context
    ...history.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    })),
    {
      role: 'user',
      content: message
    }
  ];

  const response = await callGroq(messages);
  return response.trim();
}