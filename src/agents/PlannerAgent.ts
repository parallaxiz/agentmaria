import Groq from 'groq-sdk';

const getAI = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

const SYSTEM_PROMPT = `
You are a Product Planner Agent. Your job is to define the MVP feature list, recommend a tech stack, and identify key architectural trade-offs for a given project.

### Your outputs MUST be a valid JSON object with the following structure:
{
  "mvp_features": [
    { "id": 1, "feature": "Name of feature", "description": "Short description", "priority": "high|medium|low" }
  ],
  "tech_stack": [
    { "category": "Frontend|Backend|Database|DevOps", "name": "Tool/Framework", "reason": "Why this was chosen" }
  ],
  "trade_offs": [
    { "decision": "The problem being solved", "chosen": "The chosen path", "reason": "Logic behind the decision" }
  ]
}

### Guidelines:
- Focus on creating a lean, viable product (MVP).
- Recommend modern, stable, and industry-standard technologies.
- Be specific about why technology X is better than Y for this project.
- Ensure the JSON is valid and only return the JSON object.
`;

const MODEL_CANDIDATES = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile'];

const buildFallbackPlan = (projectData: { projectName: string, description: string }) => {
  return JSON.stringify({
    mvp_features: [
      { id: 1, feature: "User Authentication", description: "Secure login/signup for the application.", priority: "high" },
      { id: 2, feature: "Core Dashboard", description: `Main view showing ${projectData.projectName} overview.`, priority: "high" },
      { id: 3, feature: "Data Management", description: `Basic CRUD operations for ${projectData.description}.`, priority: "medium" },
      { id: 4, feature: "Profile Settings", description: "User profile customization and account management.", priority: "low" }
    ],
    tech_stack: [
      { category: "Frontend", name: "React + Tailwind CSS", reason: "Modern, responsive, and easy to build." },
      { category: "Backend", name: "Node.js (Express)", reason: "Lightweight and scalable." },
      { category: "Database", name: "PostgreSQL", reason: "Reliable relational data storage." }
    ],
    trade_offs: [
      { decision: "Monolithic vs Microservices", chosen: "Monolith", reason: "Faster initial development for MVP." },
      { decision: "NoSQL vs SQL", chosen: "SQL", reason: "Strong data consistency for core logic." }
    ]
  });
};

export async function runPlannerAgent(projectData: { projectName: string, description: string }, signal?: AbortSignal): Promise<string> {
  const groq = getAI();
  if (!groq) return buildFallbackPlan(projectData);

  const prompt = `
### Project Context
Name: ${projectData.projectName}
Brief: ${projectData.description}

### Task
Create a comprehensive MVP plan, tech stack recommendation, and trade-off analysis for this project.
Return the result in the specified JSON format.
  `;

  for (const model of MODEL_CANDIDATES) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }, { signal });
      
      const text = chatCompletion.choices[0]?.message?.content || '';
      if (text) return text;
    } catch (err: any) {
      console.error(`Planner Generation Error (${model}):`, err);
    }
  }

  // Fallback if all else fails
  return buildFallbackPlan(projectData);
}
