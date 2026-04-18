import { GoogleGenAI } from '@google/genai';

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not defined in environment variables.");
  return new GoogleGenAI({ apiKey });
};

const isOpenRouterKey = (key: string) => key.startsWith('sk-or-v1-');

const runOpenRouterDesigner = async (apiKey: string, prompt: string): Promise<string> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct',
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || 'Error: Blank response';
};

const SYSTEM_PROMPT = `
You are a Lead UI/UX Designer Agent. Your goal is to generate a high-fidelity, polished, and interactive landing page or app preview based on the user's project brief.

### Design Principles:
- **Style:** Modern, sleek, "Apple-style" or "Vercel-style" aesthetics (dark mode by default, glassmorphism, subtle gradients).
- **Responsiveness:** Use Tailwind-like utility patterns (written in standard CSS) to ensure it looks great on mobile and desktop.
- **Interactivity:** Add hover effects, smooth transitions, and simple micro-animations.
- **Content:** Populate with realistic dummy text and placeholders related to the specific project brief.

### Output Structure:
1. **HTML/CSS Code Block:** Generate a single, self-contained HTML file. You MUST wrap this code in triple backticks with the 'html' language identifier (e.g., \`\`\`html ... \`\`\`).
2. **Mandatory Handoff Text:** Immediately following the code block, you MUST include exactly:
   "Here is your design preview. Do you want any changes? You can add, remove, or modify anything. Type your feedback, or say ‘approve’ to finalize."

### Guidelines:
- DO NOT use external JS libraries or frameworks.
- Use system fonts (Inter, SF Pro) or import Google Fonts if necessary.
- Focus on high visual impact to "WOW" the user.
- Ensure the code is clean and professional.
`;

const MODEL_CANDIDATES = ['gemini-1.5-flash', 'gemini-flash-latest', 'gemini-1.5-pro', 'gemini-pro-latest'];

const buildFallbackDesign = (brief: string) => {
    return `
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design Preview - ${brief.substring(0, 20)}...</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #09090b; color: #fafafa; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; line-height: 1.6; }
        .card { background: #18181b; border: 1px solid #27272a; padding: 3rem; border-radius: 1.5rem; text-align: center; max-width: 400px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .icon { font-size: 3rem; margin-bottom: 1.5rem; }
        h1 { margin: 0 0 1rem; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.025em; }
        p { color: #a1a1aa; font-size: 0.875rem; margin-bottom: 2rem; }
        .badge { background: #10b9811a; color: #10b981; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">✨</div>
        <span class="badge">Draft Preview</span>
        <h1>${brief.split(' ').slice(0, 3).join(' ')}</h1>
        <p>A high-fidelity design briefing is being prepared for this concept. This draft focuses on core user experience and streamlined accessibility.</p>
    </div>
</body>
</html>
\`\`\`

Here is your design preview. Do you want any changes? You can add, remove, or modify anything. Type your feedback, or say ‘approve’ to finalize.
  `.trim();
};

export async function runDesignerAgent(brief: string, constraints?: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not defined in environment variables.");

  if (isOpenRouterKey(apiKey)) {
    try {
      return await runOpenRouterDesigner(apiKey, `
### Task
Design Brief: ${brief}
Constraints: ${constraints || 'None specified.'}

Output the single cohesive HTML file code, followed immediately by exactly:
"Here is your design preview. Do you want any changes? You can add, remove, or modify anything. Type your feedback, or say 'approve' to finalize."
  `);
    } catch (err: any) {
      console.error("OpenRouter Generation Error:", err);
      return buildFallbackDesign(brief);
    }
  }

  const ai = getAI();
  const prompt = `
### Task
Design Brief: ${brief}
Constraints: ${constraints || 'None specified.'}

Output the single cohesive HTML file code, followed immediately by exactly:
"Here is your design preview. Do you want any changes? You can add, remove, or modify anything. Type your feedback, or say ‘approve’ to finalize."
  `;

  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.7,
          systemInstruction: SYSTEM_PROMPT,
        }
      });

      return response.text || 'Error: Blank response';
    } catch (err: any) {
      console.error(`Gemini Generation Error (${model}):`, err);
    }
  }

  return buildFallbackDesign(brief);
}
