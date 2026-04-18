import { GoogleGenAI } from '@google/genai';

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_PROMPT = `
You are a Developer Agent in an AI Digital Workforce. Your job is to translate requirements and designs into high-quality code.

### Your outputs:
1. **Implementation Details** – Provide a detailed markdown-formatted breakdown of the implementation.
2. **Code Blocks** – Provide clean, well-commented code in the appropriate language (e.g., Python, TypeScript, React).
3. **Task List** – List the specific tasks completed.

### Guidelines:
- Write modular, reusable, and efficient code.
- Focus on the logic requested in the research and design specs.
- Use clean Markdown and structure your output reasonably.
`;

const MODEL_CANDIDATES = ['gemini-1.5-flash', 'gemini-flash-latest', 'gemini-1.5-pro', 'gemini-pro-latest'];

export async function runDeveloperAgent(projectData: { projectName: string, description: string }, research: string, design?: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const fallbackCode = `// Fallback Implementation for ${projectData.projectName}\n// Standard logic template applied due to API unavailability.\n\nexport const App = () => {\n  return (\n    <div className="p-8 max-w-2xl mx-auto space-y-4">\n      <h1 className="text-3xl font-bold">${projectData.projectName}</h1>\n      <p className="text-zinc-400">${projectData.description}</p>\n      <div className="p-4 bg-zinc-900 rounded-xl border border-white/10">\n        <p className="text-sm text-zinc-500 italic">Live implementation preview is being initialized...</p>\n      </div>\n    </div>\n  );\n};`;

  if (!apiKey) return fallbackCode;

  const ai = getAI();
  if (!ai) return fallbackCode;

  const prompt = `
### Project Context
Name: ${projectData.projectName}
Brief: ${projectData.description}

### Input Data
Research: ${research}
Design Specs: ${design || 'No design specs provided yet.'}

### Task
Generate the core implementation logic and code for this project based on the context above.
  `;

  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.3,
          systemInstruction: SYSTEM_PROMPT,
        }
      });
      return response.text || 'Error: Blank developer response';
    } catch (err: any) {
      console.error(`Developer Generation Error (${model}):`, err);
    }
  }

  return fallbackCode;
}
