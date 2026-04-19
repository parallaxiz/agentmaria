import Groq from 'groq-sdk';

const getAI = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("VITE_GROQ_API_KEY is not defined in environment variables.");
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

const isOpenRouterKey = (key: string) => key.startsWith('sk-or-v1-');

const runOpenRouterDesigner = async (apiKey: string, prompt: string, signal?: AbortSignal): Promise<string> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
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

const SYSTEM_PROMPT = `You are a Senior Lead UI/UX Designer Agent specializing in high-conversion, 'Vercel-style' and 'Apple-style' digital aesthetics. Your goal is to generate a comprehensive, high-fidelity landing page preview that feels like a finished product.

Design Architecture Requirements:

Layout Depth: The page must include a sticky glassmorphism Navbar, a high-impact Hero Section with a gradient text effect, a 3-column Features Grid, a detailed 'How it Works' section with step-indicators, and a professional Footer.

Advanced Styling: Use CSS variables for a consistent dark-mode palette (#000000, #0a0a0a, #111111). Implement high-end visual effects: backdrop-filter: blur(), mask-image for fade effects, and subtle box-shadow glows.

Motion Design: Every section must have entry animations using @keyframes. Buttons must have 'shine' effects on hover and scale transitions.

Responsiveness: Use a robust CSS Grid and Flexbox system that adapts flawlessly from mobile (390px) to ultra-wide (1440px) without using external frameworks.

Content Requirements:

Realism: Use industry-specific terminology related to the user's project brief instead of generic 'Lorem Ipsum'.

Typography: Import and use 'Inter' or 'Plus Jakarta Sans' from Google Fonts for a modern, premium feel.

Output Structure:

HTML/CSS Code Block: Generate a single, self-contained, and verbose HTML file. Use detailed CSS classes that mimic Tailwind utility patterns for clarity. You MUST wrap this code in triple backticks with the 'html' language identifier.

Mandatory Handoff Text: Immediately following the code block, you MUST include exactly:
'Here is your design preview. Do you want any changes? You can add, remove, or modify anything. Type your feedback, or say ‘approve’ to finalize.'

Constraints:

No external JS libraries (no React, no jQuery).

Use only standard CSS for all logic and animations.

Focus on extreme detail—every pixel must look intentional.`;

const MODEL_CANDIDATES = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile'];

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

export async function runDesignerAgent(brief: string, constraints?: string, plannedFeatures?: string, signal?: AbortSignal): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("VITE_GROQ_API_KEY is not defined in environment variables.");

  const taskFocus = `
### Project Overview
Design Brief: ${brief}
Constraints: ${constraints || 'None specified.'}

### MANDATORY FEATURES TO IMPLEMENT
These features were selected in the planning phase and MUST be visually and interactively represented in your design:
${plannedFeatures || 'Use general best practices for this niche.'}

### Task
Generate a single cohesive HTML file that showcases these features using a high-fidelity "Vercel-style" aesthetic. 
The output MUST be followed immediately by exactly:
"Here is your design preview. Do you want any changes? You can add, remove, or modify anything. Type your feedback, or say ‘approve’ to finalize."
  `;

  if (isOpenRouterKey(apiKey)) {
    try {
      return await runOpenRouterDesigner(apiKey, taskFocus, signal);
    } catch (err: any) {
      console.error("OpenRouter Generation Error:", err);
      return buildFallbackDesign(brief);
    }
  }

  const groq = getAI();

  for (const model of MODEL_CANDIDATES) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: taskFocus }
        ],
        model,
        temperature: 0.7,
      }, { signal });

      return chatCompletion.choices[0]?.message?.content || 'Error: Blank response';
    } catch (err: any) {
      console.error(`Groq Generation Error (${model}):`, err);
    }
  }

  return buildFallbackDesign(brief);
}
