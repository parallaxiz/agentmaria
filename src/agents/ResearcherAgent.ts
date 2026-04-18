import Groq from 'groq-sdk';

const getAI = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

const isOpenRouterKey = (key: string) => key.startsWith('sk-or-v1-');

const runOpenRouterResearch = async (
  apiKey: string,
  prompt: string
): Promise<string> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct',
      temperature: 0.5,
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
  return data?.choices?.[0]?.message?.content || 'Error: Blank research response';
};

const SYSTEM_PROMPT = `
You are a Lead Deep Research Agent. Your job is to provide high-fidelity, comprehensive market research and strategic analysis.

### Report Requirements:
Your report MUST include the following 6 sections in clear Markdown:
1. **Executive Summary** – High-level overview of the opportunity.
2. **Market Dynamics & Trends** – Detailed stats, growth drivers, and technical landscape.
3. **User Personas** – At least 2 detailed profiles (Needs, Pain Points, Use Cases).
4. **Competitor SWOT Analysis** – Side-by-side comparison of 3 major players with Strengths, Weaknesses, Opportunities, and Threats.
5. **Monetization & Go-to-Market** – Strategies for revenue and initial user acquisition.
6. **Strategic Implementation roadmap** – Step-by-step technical and business phases.

### Guidelines:
- BE EXTREMELY VERBOSE AND DETAILED.
- Use professional business terminology.
- Use headers (##), subheaders (###), and clean bullet points.
- Include exactly "CONFIDENCE_SCORE: XX" (0-100) at the very end.
`;

const MODEL_CANDIDATES = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile'];

const buildFallbackResearch = (projectData: { projectName: string; description: string; reference: string }): string => {
  const projectLabel = projectData.projectName || 'Untitled Project';
  const brief = projectData.description || 'No description provided.';
  const reference = projectData.reference || 'No reference theme provided.';

  return `
# Deep Research Report: ${projectLabel}

## 1. Executive Summary
The proposed project, ${projectLabel}, aims to address the following core need: ${brief}. Initial analysis suggests a significant market whitespace for high-fidelity automation in this niche, leveraging modern AI patterns and streamlined user interfaces.

## 2. Market Dynamics & Trends
- **AI-First Workflows:** There is a recursive shift toward agentic automation where users expect self-correcting systems rather than just static tools.
- **Micro-SaaS Proliferation:** Niche-specific operational tools are capturing market share from broad horizontal platforms due to lower onboarding friction.
- **Cloud-Native Resilience:** Secure, scalable architecture is now a non-negotiable benchmark for enterprise and prosumer adoption.

## 3. Targeted User Personas
### Persona A: The Operational Optimizer
- **Role:** Mid-market manager or small business owner.
- **Pain Point:** Spending 10+ hours a week on manual data entry and synchronization.
- **Need:** A "set and forget" system that provides real-time visibility into ${projectLabel} metrics.

### Persona B: The Tech-Savvy Independent
- **Role:** High-volume individual contributor.
- **Pain Point:** Tool fragmentation and lack of meaningful cross-platform analytics.
- **Need:** High-fidelity integration between ${reference} concepts and actual output.

## 4. Competitor SWOT Analysis
| Factor | Modern Platforms | Legacy Suites | Open Source Tools |
| :--- | :--- | :--- | :--- |
| **Strengths** | Fast UX, AI features | Brand trust, depth | Flexibility, No cost |
| **Weaknesses** | High churn, narrow | Slow, complex | Setup overhead |
| **Opportunities** | Niche Dominance | Migration services | Custom plugins |
| **Threats** | Big Tech entry | Irrelevance | Technical debt |

## 5. Monetization & Go-To-Market
- **Tier 1 (Pro):** $29/mo for core automation and standard reporting.
- **Tier 2 (Scale):** $99/mo for advanced agentic capacity and custom integrations.
- **Strategy:** Leverage content marketing around ${projectLabel}'s unique value proposition followed by a "freemium" pilot phase.

## 6. Strategic Implementation Roadmap
- **Phase 1 (MVP):** Finalize core data schema and basic agentic nodes.
- **Phase 2 (Polish):** Implement high-fidelity design specs derived from design prototypes.
- **Phase 3 (Scale):** Rollout multi-agent orchestration and advanced error handling.

CONFIDENCE_SCORE: 82
  `.trim();
};

export async function runResearcherAgent(projectData: { projectName: string, description: string, reference: string }): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return buildFallbackResearch(projectData);

  if (isOpenRouterKey(apiKey)) {
    try {
      const prompt = `
### Project Context
Name: ${projectData.projectName}
Brief: ${projectData.description}
Reference/Theme: ${projectData.reference}

### Task
Perform a deep technical and market research analysis for this project.
      `;
      return await runOpenRouterResearch(apiKey, prompt);
    } catch (err: any) {
      console.error('Researcher OpenRouter Error:', err);
      return `${buildFallbackResearch(projectData)}\n\n> Note: OpenRouter API request failed, fallback research was used.`;
    }
  }

  const groq = getAI();
  if (!groq) return buildFallbackResearch(projectData);

  const prompt = `
### Project Context
Name: ${projectData.projectName}
Brief: ${projectData.description}
Reference/Theme: ${projectData.reference}

### Task
Perform a deep technical and market research analysis for this project.
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
      return chatCompletion.choices[0]?.message?.content || 'Error: Blank research response';
    } catch (err: any) {
      console.error(`Researcher Generation Error (${model}):`, err);
    }
  }

  // Keep workflow resilient even if external AI call fails.
  return `${buildFallbackResearch(projectData)}\n\n> Note: Groq API request failed, fallback research was used.`;
}
