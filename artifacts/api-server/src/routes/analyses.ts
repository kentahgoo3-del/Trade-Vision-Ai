import { Router } from "express";
import { db } from "@workspace/db";
import { analyses } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const ANALYSIS_PROMPT = `You are an expert institutional-grade AI trading decision engine. Analyze this chart image with maximum precision and depth.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "trend": "bullish" or "bearish" or "neutral",
  "trendStrength": <integer 0-100>,
  "patterns": ["pattern name 1", "pattern name 2"],
  "indicators": "Brief description of visible indicators and their signals",
  "supportLevels": "Key support level(s) visible on chart",
  "resistanceLevels": "Key resistance level(s) visible on chart",
  "tradeDirection": "long" or "short" or "wait",
  "entryPrice": "Specific entry zone or price level",
  "stopLoss": "Stop loss level with brief rationale",
  "takeProfit1": "Conservative target",
  "takeProfit2": "Mid-range target",
  "takeProfit3": "Aggressive target",
  "riskReward": "1:X.X ratio",
  "confidence": <integer 0-100>,
  "confidenceLabel": "Low" or "Medium" or "High" or "Very High",
  "explanation": "2-3 sentences describing overall market structure and key insights",
  "strengths": ["strength point 1", "strength point 2"],
  "weaknesses": ["weakness or uncertainty 1"],
  "risks": ["risk factor 1", "risk factor 2"],
  "invalidationLevel": "Price level that invalidates this setup",
  "tradeDecision": "BUY" or "SELL" or "WAIT" or "NO TRADE",
  "overallScore": <integer 0-100>,
  "confidenceBreakdown": {
    "trendStrength": <0-100>,
    "momentum": <0-100>,
    "patternQuality": <0-100>,
    "volumeConfirmation": <0-100>,
    "supportResistance": <0-100>,
    "riskReward": <0-100>,
    "indicatorAlignment": <0-100>,
    "newsSentiment": <0-100>,
    "marketVolatility": <0-100>,
    "liquidity": <0-100>,
    "multiTimeframeAlignment": <0-100>
  },
  "tradePlan": {
    "entryZone": "Price range for optimal entry",
    "optimalEntry": "Single best entry price",
    "stopLoss": "Exact stop loss level",
    "takeProfit1": "TP1 - conservative target",
    "takeProfit2": "TP2 - primary target",
    "takeProfit3": "TP3 - extended target",
    "breakeven": "Move stop to breakeven after this target",
    "trailingStop": "Trailing stop strategy recommendation",
    "maxLoss": "Maximum acceptable loss as % of position",
    "expectedProfit": "Expected profit if TP2 is reached",
    "riskRewardRatio": "1:X.X"
  },
  "scenarios": [
    { "name": "Primary scenario name", "probability": <integer>, "action": "BUY" or "SELL" or "WAIT" or "NO TRADE", "description": "Brief 1-sentence description" },
    { "name": "Secondary scenario name", "probability": <integer>, "action": "BUY" or "SELL" or "WAIT" or "NO TRADE", "description": "Brief 1-sentence description" },
    { "name": "Tertiary scenario name", "probability": <integer>, "action": "BUY" or "SELL" or "WAIT" or "NO TRADE", "description": "Brief 1-sentence description" }
  ],
  "marketPsychology": [
    "Observation about what buyers/sellers are doing",
    "Observation about institutional vs retail behavior",
    "Observation about market sentiment"
  ],
  "tradeChecklist": {
    "trendConfirmed": <boolean>,
    "patternConfirmed": <boolean>,
    "volumeConfirmed": <boolean>,
    "momentumConfirmed": <boolean>,
    "indicatorsAligned": <boolean>,
    "supportNearby": <boolean>,
    "resistanceIdentified": <boolean>,
    "riskAcceptable": <boolean>,
    "noConflictingSignals": <boolean>,
    "noMajorNews": <boolean>
  },
  "multiTimeframe": [
    { "timeframe": "15m",   "bias": "Bullish" or "Bearish" or "Neutral", "agreement": <boolean> },
    { "timeframe": "1H",    "bias": "Bullish" or "Bearish" or "Neutral", "agreement": <boolean> },
    { "timeframe": "4H",    "bias": "Bullish" or "Bearish" or "Neutral", "agreement": <boolean> },
    { "timeframe": "Daily", "bias": "Bullish" or "Bearish" or "Neutral", "agreement": <boolean> },
    { "timeframe": "Weekly","bias": "Bullish" or "Bearish" or "Neutral", "agreement": <boolean> }
  ],
  "riskBreakdown": {
    "volatility": "Low" or "Medium" or "High",
    "drawdownRisk": "Low" or "Medium" or "High",
    "trendRisk": "Low" or "Medium" or "High",
    "gapRisk": "Low" or "Medium" or "High",
    "newsRisk": "Low" or "Medium" or "High",
    "liquidityRisk": "Low" or "Medium" or "High",
    "slippageRisk": "Low" or "Medium" or "High",
    "overall": "Low" or "Medium" or "High"
  },
  "tradeQualityStars": <integer 1-5>,
  "coachAdvice": [
    "Specific coaching tip 1",
    "Specific coaching tip 2",
    "Specific coaching tip 3"
  ],
  "patternExplanations": [
    {
      "name": "Pattern name",
      "what": "What this pattern is in simple terms",
      "why": "Why it matters and what it signals to traders",
      "successRate": "Historical success rate as percentage",
      "failures": "Most common failure condition",
      "confirmation": "Ideal confirmation signal to look for before entering"
    }
  ],
  "beginnerExplanation": "Plain English 2-3 sentence explanation of the whole setup for someone new to trading.",
  "newsSentiment": {
    "classification": "Very Bullish" or "Bullish" or "Neutral" or "Bearish" or "Very Bearish",
    "score": <0-100>,
    "impact": "How current macro/news environment may affect this trade",
    "summary": "General market sentiment assessment for this asset class"
  }
}

Rules:
- Set tradeDecision to WAIT or NO TRADE if overallScore < 75
- All 3 scenario probabilities must sum to exactly 100
- Provide pattern explanations for every detected pattern (at least 1)
- Provide at least 3 coach advice tips
- Be precise with price levels based on visible chart data`;

router.get("/", async (_req, res) => {
  const rows = await db.select().from(analyses).orderBy(desc(analyses.createdAt));
  res.json(rows.map(mapAnalysis));
});

router.get("/stats", async (_req, res) => {
  const rows = await db.select().from(analyses).where(eq(analyses.status, "complete"));

  const bullish = rows.filter((r) => r.trend === "bullish").length;
  const bearish = rows.filter((r) => r.trend === "bearish").length;
  const neutral = rows.filter((r) => r.trend === "neutral").length;

  const avgConfidence =
    rows.length > 0
      ? rows.reduce((sum, r) => sum + parseFloat(r.confidence ?? "0"), 0) / rows.length
      : 0;

  const patternCounts: Record<string, number> = {};
  for (const row of rows) {
    if (row.patterns) {
      try {
        const patterns: string[] = JSON.parse(row.patterns);
        for (const p of patterns) patternCounts[p] = (patternCounts[p] ?? 0) + 1;
      } catch {}
    }
  }

  const topPatterns = Object.entries(patternCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern, count]) => ({ pattern, count }));

  res.json({ totalAnalyses: rows.length, bullishCount: bullish, bearishCount: bearish, neutralCount: neutral, avgConfidence: Math.round(avgConfidence), topPatterns });
});

router.get("/recent", async (_req, res) => {
  const rows = await db.select().from(analyses).where(eq(analyses.status, "complete")).orderBy(desc(analyses.createdAt)).limit(5);
  res.json(rows.map(mapAnalysis));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const [row] = await db.select().from(analyses).where(eq(analyses.id, id));
  if (!row) { res.status(404).json({ error: "Analysis not found" }); return; }
  res.json(mapAnalysis(row));
});

router.post("/", async (req, res) => {
  const { symbol, timeframe, imageBase64 } = req.body as { symbol?: string; timeframe?: string; imageBase64: string };

  if (!imageBase64) { res.status(400).json({ error: "imageBase64 is required" }); return; }

  const [created] = await db.insert(analyses).values({ symbol, timeframe, imageBase64, status: "pending" }).returning();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: ANALYSIS_PROMPT },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "high" } },
        ],
      }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const r = JSON.parse(raw);

    const [updated] = await db.update(analyses).set({
      status: "complete",
      trend: r.trend,
      trendStrength: r.trendStrength?.toString(),
      patterns: JSON.stringify(r.patterns ?? []),
      indicators: r.indicators,
      supportLevels: r.supportLevels,
      resistanceLevels: r.resistanceLevels,
      tradeDirection: r.tradeDirection,
      entryPrice: r.entryPrice,
      stopLoss: r.stopLoss,
      takeProfit1: r.takeProfit1,
      takeProfit2: r.takeProfit2,
      takeProfit3: r.takeProfit3,
      riskReward: r.riskReward,
      confidence: r.confidence?.toString(),
      confidenceLabel: r.confidenceLabel,
      explanation: r.explanation,
      strengths: JSON.stringify(r.strengths ?? []),
      weaknesses: JSON.stringify(r.weaknesses ?? []),
      risks: JSON.stringify(r.risks ?? []),
      invalidationLevel: r.invalidationLevel,
      tradeDecision: r.tradeDecision,
      overallScore: r.overallScore,
      confidenceBreakdown: r.confidenceBreakdown ?? null,
      tradePlan: r.tradePlan ?? null,
      scenarios: r.scenarios ?? null,
      marketPsychology: r.marketPsychology ?? null,
      tradeChecklist: r.tradeChecklist ?? null,
      multiTimeframe: r.multiTimeframe ?? null,
      riskBreakdown: r.riskBreakdown ?? null,
      tradeQualityStars: r.tradeQualityStars,
      coachAdvice: r.coachAdvice ?? null,
      patternExplanations: r.patternExplanations ?? null,
      beginnerExplanation: r.beginnerExplanation,
      newsSentiment: r.newsSentiment ?? null,
    }).where(eq(analyses.id, created!.id)).returning();

    res.status(201).json(mapAnalysis(updated!));
  } catch (err) {
    await db.update(analyses).set({ status: "error" }).where(eq(analyses.id, created!.id));
    console.error("AI analysis failed:", err);
    res.status(201).json(mapAnalysis({ ...created!, status: "error" }));
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const result = await db.delete(analyses).where(eq(analyses.id, id)).returning();
  if (!result.length) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).send();
});

function mapAnalysis(row: typeof analyses.$inferSelect) {
  return {
    id: row.id,
    symbol: row.symbol,
    timeframe: row.timeframe,
    chartType: row.chartType,
    imageBase64: row.imageBase64,
    status: row.status,
    trend: row.trend,
    trendStrength: row.trendStrength ? parseFloat(row.trendStrength) : null,
    patterns: row.patterns,
    indicators: row.indicators,
    supportLevels: row.supportLevels,
    resistanceLevels: row.resistanceLevels,
    tradeDirection: row.tradeDirection,
    entryPrice: row.entryPrice,
    stopLoss: row.stopLoss,
    takeProfit1: row.takeProfit1,
    takeProfit2: row.takeProfit2,
    takeProfit3: row.takeProfit3,
    riskReward: row.riskReward,
    confidence: row.confidence ? parseFloat(row.confidence) : null,
    confidenceLabel: row.confidenceLabel,
    explanation: row.explanation,
    strengths: row.strengths,
    weaknesses: row.weaknesses,
    risks: row.risks,
    invalidationLevel: row.invalidationLevel,
    tradeDecision: row.tradeDecision,
    overallScore: row.overallScore,
    confidenceBreakdown: row.confidenceBreakdown,
    tradePlan: row.tradePlan,
    scenarios: row.scenarios,
    marketPsychology: row.marketPsychology,
    tradeChecklist: row.tradeChecklist,
    multiTimeframe: row.multiTimeframe,
    riskBreakdown: row.riskBreakdown,
    tradeQualityStars: row.tradeQualityStars,
    coachAdvice: row.coachAdvice,
    patternExplanations: row.patternExplanations,
    beginnerExplanation: row.beginnerExplanation,
    newsSentiment: row.newsSentiment,
    createdAt: row.createdAt.toISOString(),
  };
}

export default router;
