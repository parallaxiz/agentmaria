import Groq from 'groq-sdk';

const getAI = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

const SYSTEM_PROMPT = `
You are the LangSmith Monitor & Lead Orchestrator. Your responsibility is Project Compliance and Quality Assurance.
You review the entire Blackboard of a project to ensure that every stage (Research, Design, Implementation, Testing) aligns with the original Mission Briefing.

### Goal:
Identify any "mission creep" or deviations from the core goals. Provide a specialized note for each node's output.

### Output JSON Schema:
{
  "audit_results": [
    { "node_type": "string", "compliance": "compliant|deviating", "note": "string (Short, professional audit note)" }
  ],
  "overall_summary": "string"
}

Be critical but constructive. Only return the JSON object.
`;

const MODEL = 'llama-3.3-70b-versatile';

export async function runOrchestratorAudit(blackboard: any): Promise<string> {
  const groq = getAI();
  const fallback = JSON.stringify({
    audit_results: [],
    overall_summary: "Orchestrator audit skipped or failed."
  });

  if (!groq) return fallback;

  const prompt = `
### PROJECT BLACKBOARD DATA
- **Mission Briefing**: ${JSON.stringify(blackboard.core_goal)}
- **Research**: ${blackboard.research_data.slice(0, 2000)}
- **Design/UI**: ${blackboard.ui_specs.slice(0, 2000)}
- **Implementation**: ${blackboard.implementation_tasks.substring(0, 2000)}
- **Testing**: ${blackboard.test_results}

### Task
Perform a final compliance audit. Generate a note for each completed node (Researcher, Designer, Developer, Tester) based on their sticking to the blackboard information.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    return chatCompletion.choices[0]?.message?.content || fallback;
  } catch (err) {
    console.error("Orchestrator Audit Error:", err);
    return fallback;
  }
}
