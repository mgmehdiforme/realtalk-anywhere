export interface QwenAnalysisResult {
  executiveSummary: string;
  insights: Array<{
    category: string;
    observation: string;
    tip: string;
  }>;
  recommendedPhase: "Discover" | "Validate" | "Blueprint" | "Build" | "Launch" | "Scale" | "Partner";
  recommendedPhaseReasoning: string;
  currentStage: string;
  challengesSummary: string;
}

const DEFAULT_MOCK_RESULT: QwenAnalysisResult = {
  executiveSummary: "Your project represents a highly promising initiative addressing a real-world market friction. By combining a clear understanding of the target audience with a well-scoped MVP, you are positioned to validate your key hypotheses quickly. Focus on tightening your feedback loops with initial design partners before scaling the underlying technical infrastructure.",
  insights: [
    {
      category: "Problem & Market Fit",
      observation: "The problem identified is experienced by a specific, high-intent B2B target group who currently rely on manual, Excel-based workarounds.",
      tip: "Focus your MVP messaging on time saved and elimination of manual copy-paste errors rather than broad feature coverage."
    },
    {
      category: "Product & Scope",
      observation: "Your core feature set is solid, but there is a slight risk of scope creep in the initial launch by adding secondary integrations too early.",
      tip: "Defer the payment gateway and advanced analytics until you have 5 active pilot users. Use manual invoicing initially."
    },
    {
      category: "Technology & Stack",
      observation: "Your stack choice is modern and scalable. However, the lack of experienced in-house developers means you need a clean, maintainable architecture from day one.",
      tip: "Adopt a monolithic structure with a modular design (e.g., NestJS or structured .NET) instead of a complex microservices architecture."
    }
  ],
  recommendedPhase: "Blueprint",
  recommendedPhaseReasoning: "Based on your answers, you have validated the core problem but require a technical blueprint (architecture diagrams, schema definitions, and API specifications) before writing production code. This will prevent expensive rewrites later.",
  currentStage: "Validated Idea & Requirements Defined",
  challengesSummary: "The chief risks are hiring speed, coordination of external tech partners, and technical scope creep before reaching product-market fit."
};

/**
 * Generate AI analysis report from assessment answers using Qwen
 */
export async function analyzeAssessmentAnswers(
  answers: Record<string, any>,
  founderEmail: string
): Promise<QwenAnalysisResult> {
  const apiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    console.log("No Qwen API Key found (QWEN_API_KEY / DASHSCOPE_API_KEY). Using mock report generator.");
    // Simulate slight network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Customize the mock a bit based on answers
    const mock = { ...DEFAULT_MOCK_RESULT };
    const startupName = answers.startupName || "your startup";
    const founderName = answers.founderName || "Founder";
    
    mock.executiveSummary = `Analysis for ${startupName} (founded by ${founderName}): ${mock.executiveSummary}`;
    
    // Map answer-based recommendations dynamically if possible
    const budget = answers.budgetRange || "";
    const timeline = answers.launchTimeline || "";
    
    if (timeline.includes("Less than 1 month")) {
      mock.recommendedPhase = "Build";
      mock.recommendedPhaseReasoning = "With a critical launch timeline under 1 month, you must immediately enter the Build phase focusing exclusively on a single core feature and utilizing a pre-built SaaS starter kit.";
    } else if (answers.hasExistingCode === "yes_rescue") {
      mock.recommendedPhase = "Validate";
      mock.recommendedPhaseReasoning = "Given the existing codebase requires rescue or rewrite, we recommend a rapid technical audit and validation of the existing code structure to salvage what is clean before starting new development.";
    }
    
    return mock;
  }

  const systemPrompt = `You are a Senior SaaS Architect and Founder Advisor. 
Analyze the provided startup assessment answers and return a JSON object with a structured analysis.
The JSON object MUST exactly match the following structure:
{
  "executiveSummary": "A concise 2-3 sentence overview summarizing the founder profile, startup idea, and primary opportunity.",
  "insights": [
    {
      "category": "Problem & Market Fit",
      "observation": "What you observe from their problem description and audience.",
      "tip": "Direct actionable recommendation."
    },
    {
      "category": "Product & Scope",
      "observation": "What you observe from their product features and prototype status.",
      "tip": "Direct actionable recommendation."
    },
    {
      "category": "Technology & Stack",
      "observation": "What you observe from their tech stack preference and existing code.",
      "tip": "Direct actionable recommendation."
    }
  ],
  "recommendedPhase": "Discover" | "Validate" | "Blueprint" | "Build" | "Launch" | "Scale" | "Partner",
  "recommendedPhaseReasoning": "Explain why this specific Founder-to-Launch phase is the logical next step.",
  "currentStage": "A 3-5 word label of their current stage.",
  "challengesSummary": "A summary of their technical, timeline, and budgetary challenges."
}

Do not return any markdown formatting (like \`\`\`json), just return the raw JSON string. Ensure the response parses correctly as JSON.`;

  const userPrompt = `Assessment answers for founder ${founderEmail}:
${JSON.stringify(answers, null, 2)}`;

  try {
    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Qwen API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Clean potential markdown code blocks returned by LLM
    const cleanJson = content.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const result = JSON.parse(cleanJson) as QwenAnalysisResult;
    
    // Validation of recommendedPhase
    const phases = ["Discover", "Validate", "Blueprint", "Build", "Launch", "Scale", "Partner"];
    if (!phases.includes(result.recommendedPhase)) {
      result.recommendedPhase = "Discover";
    }
    
    return result;
  } catch (error) {
    console.error("Error communicating with Qwen API:", error);
    // Graceful fallback to mock result
    return {
      ...DEFAULT_MOCK_RESULT,
      executiveSummary: `[AI Fallback Mode] Analysis for ${answers.startupName || "your startup"}: ${DEFAULT_MOCK_RESULT.executiveSummary}`
    };
  }
}
