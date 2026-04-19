import Groq from 'groq-sdk';

const getAI = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

const SYSTEM_PROMPT = `
You are a Technical Writer specializing in layman's terms and developer accessibility. Your goal is to take a complex technical project and explain it so a non-technical person can understand it, while also providing foolproof instructions for a Windows user to run it.

### Your Report Structure:
1. **The Big Picture (Layman's Terms)**: Explain what the app is, who it's for, and how it works using simple analogies. No jargon.
2. **How it was Built**: Briefly explain the "engine" (tech stack) in simple terms (e.g., "React is like the LEGO blocks we used to build the interface").
3. **Getting Started on Windows**:
    - List pre-requisites (Node.js, Git) with a "How to check" for each.
    - Provide exact commands for a Windows terminal (CMD or PowerShell).
    - Explain 'npm install' and 'npm run dev'.
4. **Troubleshooting**: 2-3 common Windows errors (like script execution policy or port already in use).

### Guidelines:
- Use a friendly, encouraging tone.
- Use Markdown headers (##), Bold text, and Code blocks (\`\`\`).
- Ensure all technical commands are specifically for Windows.
- Keep it concise but comprehensive.
`;

const MODEL_CANDIDATES = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile'];

export async function runWriterAgent(
  projectData: { projectName: string; description: string },
  implementationData: string,
  researchData: string
): Promise<string> {
  const groq = getAI();
  if (!groq) return "Error: Writer Agent requires a valid GROQ_API_KEY.";

  const prompt = `
### Project Context
Name: ${projectData.projectName}
Brief: ${projectData.description}

### Market/Technical Research
${researchData}

### Current Implementation (Code/Repository)
${implementationData}

### Task:
Generate a layman-friendly "Windows Setup & User Guide" for this project.
  `;

  for (const model of MODEL_CANDIDATES) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        model,
        temperature: 0.5,
      });
      return chatCompletion.choices[0]?.message?.content || 'Error: Blank documentation response';
    } catch (err: any) {
      console.error(`Writer Generation Error (${model}):`, err);
    }
  }

  return "Error: Writer Agent failed to generate documentation. Please check your implementation and try again.";
}
