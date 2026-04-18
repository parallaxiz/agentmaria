import Groq from 'groq-sdk';

const getAI = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

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

const MODEL_CANDIDATES = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile'];

export async function runDeveloperAgent(projectData: { projectName: string, description: string }, research: string, design?: string, plannedFeatures?: string): Promise<string> {
  const groq = getAI();
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

  if (!groq) return fallbackRepo;

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

### Task
Generate the complete project repository. Ensure that all Selected MVP Features above have functional code implementations in the generated files.
  `;

  for (const model of MODEL_CANDIDATES) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        model,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const text = chatCompletion.choices[0]?.message?.content || '';
      if (text) return text;
    } catch (err: any) {
      console.error(`Developer Generation Error (${model}):`, err);
    }
  }

  return fallbackRepo;
}
