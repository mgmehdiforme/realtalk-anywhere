export interface QwenAnalysisResult {
  executiveSummary: string;
  founderStrengths: string[];
  biggestOpportunities: Array<{ title: string; description: string }>;
  whatCouldSlowYouDown: Array<{ risk: string; businessImpact: string; technicalImpact: string }>;
  ifThisWereMyStartup: string[];
  engineeringStrategy: Array<{ area: string; recommendation: string; why: string }>;
  fastestPathToLaunch: string[];
  recommendedPhase: "Discover" | "Validate" | "Blueprint" | "Build" | "Launch" | "Scale" | "Partner";
  recommendedPhaseReasoning: string;
  currentStage: string;
}

const DEFAULT_MOCK_RESULT: QwenAnalysisResult = {
  executiveSummary: "Your SaaS project addresses a clear market friction by aiming to streamline early MVP blueprinting and scoping. The biggest opportunity is standardizing unstructured specifications into direct roadmaps, while the primary execution risk is technical scope creep before validating core demand. We recommend entering the Validate phase to isolate key assumptions before building.",
  founderStrengths: [
    "Clear vision of the primary problem and targeted audience niche.",
    "Strong understanding of the modern web tech stack preferences.",
    "Highly realistic launch expectations and milestones."
  ],
  biggestOpportunities: [
    {
      title: "Fast Validation Window",
      description: "You can validate the demand by offering manual scoping to 5 active pilot users before writing code."
    },
    {
      title: "AI Scoping Differentiation",
      description: "Positioning the platform as a domain-specific scoped blueprint generator makes it stand out from generic AI agents."
    }
  ],
  whatCouldSlowYouDown: [
    {
      risk: "Scope Creep & Secondary Features",
      businessImpact: "Increases cost and delays launch by several months, risking competitor entry.",
      technicalImpact: "Complex database relationships and API mocks created before core validation."
    },
    {
      risk: "Sourcing Qualified Developers",
      businessImpact: "Slows down development pace and leads to communication gaps.",
      technicalImpact: "Technical debt accumulates if the initial code structure is not modular and well-documented."
    }
  ],
  ifThisWereMyStartup: [
    "Defer all secondary integrations (like Stripe/advanced analytics) until you onboard 5 active design partners.",
    "Verify the core user flow manually by acting as the scoping engineer behind the scenes first.",
    "Establish a modular monolithic backend to keep scaling simple and codebase highly maintainable."
  ],
  engineeringStrategy: [
    {
      area: "Backend Architecture",
      recommendation: "Modular Monolith using NestJS or structured .NET Core.",
      why: "Avoids the overhead of microservices while keeping domains separated for future scaling."
    },
    {
      area: "Database Design",
      recommendation: "Relational SQL database (PostgreSQL).",
      why: "Provides strong transactional guarantees and clear schemas for entities like founders, roadmaps, and features."
    }
  ],
  fastestPathToLaunch: [
    "Design a simple 3-step interactive questionnaire instead of a complex multi-wizard UI.",
    "Manually compile the first 20 roadmap PDF reports and email them to users to check if they find them valuable.",
    "Postpone payment gateway integration and bill early design partners manually via Stripe invoicing."
  ],
  recommendedPhase: "Validate",
  recommendedPhaseReasoning: "Before committing resources to full engineering, we must validate that founders are willing to spend time filling out assessments to get these blueprints. Focus on customer problem confirmation.",
  currentStage: "Ideation & Problem Confirmed"
};

/**
 * Generate AI analysis report from blueprint inputs using Qwen
 */
export async function analyzeBlueprintAnswers(
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
Analyze the provided startup blueprint inputs and return a JSON object with a structured analysis.
The JSON object MUST exactly match the following structure:
{
  "executiveSummary": "A concise 2-3 sentence overview summarizing the founder profile, startup idea, and primary opportunity.",
  "founderStrengths": [
    "Strength 1...",
    "Strength 2...",
    "Strength 3..."
  ],
  "biggestOpportunities": [
    {
      "title": "Opportunity Title",
      "description": "Opportunity description and rationale."
    }
  ],
  "whatCouldSlowYouDown": [
    {
      "risk": "Description of the risk",
      "businessImpact": "The impact on timeline, cost, launch, or customer confusion.",
      "technicalImpact": "The impact on engineering, complexity, and debt."
    }
  ],
  "ifThisWereMyStartup": [
    "Actionable priority 1 in Mehdi's voice...",
    "Actionable priority 2 in Mehdi's voice..."
  ],
  "engineeringStrategy": [
    {
      "area": "Area (e.g. Architecture, Database, AI integrations)",
      "recommendation": "Technology choice or design structure",
      "why": "Clear engineering explanation of why this was chosen."
    }
  ],
  "fastestPathToLaunch": [
    "Actionable step 1 to launch sooner...",
    "Actionable step 2 to launch sooner..."
  ],
  "recommendedPhase": "Discover" | "Validate" | "Blueprint" | "Build" | "Launch" | "Scale" | "Partner",
  "recommendedPhaseReasoning": "Explain why this specific Founder-to-Launch phase is the logical next step.",
  "currentStage": "A 3-5 word label of their current stage."
}

Style Guidelines:
1. Speak in Mehdi Golzari's voice as an Independent Technical Partner.
2. Use phrases like:
   - "If this were my startup..."
   - "The biggest execution risk I see..."
   - "The first assumption I would challenge..."
   - "Before investing months in development..."
   - "If we were working together..."
3. DO NOT use generic templates like "Based on your inputs..." or "We recommend...". Write naturally as if talking directly to a founder.
4. Keep the tone optimistic but highly realistic and strategic.
5. Do not return any markdown formatting (like \`\`\`json), just return the raw JSON string. Ensure the response parses correctly as JSON.`;

  const userPrompt = `Blueprint inputs for founder ${founderEmail}:
${JSON.stringify(answers, null, 2)}`;

  try {
    const baseUrl = process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
    const fetchUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl.replace(/\/$/, "")}/chat/completions`;
    const modelName = process.env.QWEN_MODEL || "qwen-plus";

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
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
