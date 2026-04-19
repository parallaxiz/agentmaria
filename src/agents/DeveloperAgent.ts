import { GoogleGenerativeAI } from '@google/generative-ai';

const getOpenRouterKey = () => import.meta.env.VITE_OPENROUTER_API_KEY;
const getGeminiKey = () => import.meta.env.VITE_GEMINI_DEVELOPER_API_KEY;

const SYSTEM_PROMPT = `
You are a Lead Developer Agent. Your job is to translate project requirements, research, and designs into a full, production-ready project repository.

### Requirements:
1. **Output Format**: You MUST output a valid JSON object.
2. **JSON Schema**:
{
  "repo_name": "string",
  "files": [
    { "path": "string", "content": "string" }
  ]
}
3. **Project Structure**:
   - Generate a comprehensive file tree.
   - Include standard files: package.json, README.md, .gitignore.
   - Include core source files (e.g., src/App.tsx, src/index.css, src/main.tsx, components/...).
   - Implement the logic described in the Research and Design specs provided.

### Guidelines:
- Use modern, clean, and well-commented code.
- Ensure all file paths are logical and follow standard project conventions.
- Provide FULL file contents, not snippets.
- Only return the JSON object, NO other text or markdown wrappers.
`;

const OPENROUTER_MODELS = [
  'mistralai/pixtral-12b:free',
  'google/gemini-2.0-flash-exp:free',
  'openrouter/auto'
];

export async function runDeveloperAgent(projectData: { projectName: string, description: string }, research: string, design?: string, plannedFeatures?: string, testFeedback?: string): Promise<string> {
  const orKey = getOpenRouterKey();
  const geminiKey = getGeminiKey();
  
  const fallbackRepo = JSON.stringify({
    repo_name: projectData.projectName.toLowerCase().replace(/\s+/g, '-'),
    files: [
      {
        path: "README.md",
        content: `# ${projectData.projectName}\n\n${projectData.description}\n\n## Repository Status\nThis repository is currently in an initialization state.`
      },
      {
        path: "src/App.tsx",
        content: `export default function App() {\n  return (\n    <div className="p-8">\n      <h1>Welcome to ${projectData.projectName}</h1>\n    </div>\n  );\n}`
      }
    ]
  });

  const prompt = `
### Project Context
Name: ${projectData.projectName}
Brief: ${projectData.description}

### MANDATORY MVP FEATURES TO IMPLEMENT
You MUST implement the following features in the codebase. Every list item below requires dedicated logic/components in the PR:
${plannedFeatures || 'Use general best practices for this niche.'}

### Input Context
Research Data: ${research}
UI/Design Specs: ${design || 'No design specs provided yet.'}

${testFeedback ? `
### CRITICAL CORRECTIONS REQUIRED
The Tester has identified the following bugs or missing implementations. YOU MUST FIX THESE IN THIS ITERATION:
${testFeedback}
` : ''}

### Task
Generate the complete project repository. Ensure that all Selected MVP Features above have functional code implementations in the generated files.
  `;

  // 1. Try OpenRouter (Primary)
  if (orKey) {
    for (const model of OPENROUTER_MODELS) {
      try {
        console.log(`Developer Agent: Attempting OpenRouter generation with ${model}...`);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${orKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://agent-maria.com",
            "X-Title": "Agent Maria",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content || '';
          if (text) return text;
        } else {
          const errBody = await response.json().catch(() => ({}));
          console.warn(`OpenRouter ${model} failed:`, errBody);
        }
      } catch (err: any) {
        console.error(`OpenRouter ${model} Error:`, err);
      }
    }
  }

  // 2. Try Gemini 1.5 Pro (Fallback)
  if (geminiKey) {
    try {
      console.log("Developer Agent: Attempting fallback generation with Gemini 1.5 Pro...");
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        systemInstruction: SYSTEM_PROMPT
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const text = result.response.text();
      if (text) return text;
    } catch (err: any) {
      console.error(`Gemini Fallback Error:`, err);
    }
  }

  return fallbackRepo;
}
