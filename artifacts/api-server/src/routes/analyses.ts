import { Router } from "express";
import { db } from "@workspace/db";
import { analyses } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const ANALYSIS_PROMPT = `You are an expert institutional-grade technical analyst. Analyze this trading chart image carefully and provide a comprehensive analysis.

Return ONLY a valid JSON object with this exact structure, no extra text:
{
  "trend": "bullish" or "bearish" or "neutral",
  "trendStrength": <integer 0-100>,
  "patterns": ["pattern name 1", "pattern name 2"],
  "indicators": "Brief description of visible indicators and their signals",
  "supportLevels": "Key support level(s) visible on the chart",
  "resistanceLevels": "Key resistance level(s) visible on the chart",
  "tradeDirection": "long" or "short" or "wait",
  "entryPrice": "Specific entry zone or price",
  "stopLoss": "Stop loss level with brief rationale",
  "takeProfit1": "Conservative target",
  "takeProfit2": "Mid-range target",
  "takeProfit3": "Aggressive target",
  "riskReward": "1:X.X ratio",
  "confidence": <integer 0-100>,
  "confidenceLabel": "Low" or "Medium" or "High" or "Very High",
  "explanation": "2-3 sentences describing the overall market structure and key insights",
  "strengths": ["strength point 1", "strength point 2"],
  "weaknesses": ["weakness or uncertainty 1"],
  "risks": ["risk factor 1", "risk factor 2"],
  "invalidationLevel": "Price level that would invalidate this trade setup"
}`;

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
        for (const p of patterns) {
          patternCounts[p] = (patternCounts[p] ?? 0) + 1;
        }
      } catch {}
    }
  }

  const topPatterns = Object.entries(patternCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern, count]) => ({ pattern, count }));

  res.json({
    totalAnalyses: rows.length,
    bullishCount: bullish,
    bearishCount: bearish,
    neutralCount: neutral,
    avgConfidence: Math.round(avgConfidence),
    topPatterns,
  });
});

router.get("/recent", async (_req, res) => {
  const rows = await db
    .select()
    .from(analyses)
    .where(eq(analyses.status, "complete"))
    .orderBy(desc(analyses.createdAt))
    .limit(5);
  res.json(rows.map(mapAnalysis));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const [row] = await db.select().from(analyses).where(eq(analyses.id, id));
  if (!row) { res.status(404).json({ error: "Analysis not found" }); return; }
  res.json(mapAnalysis(row));
});

router.post("/", async (req, res) => {
  const { symbol, timeframe, imageBase64 } = req.body as {
    symbol?: string;
    timeframe?: string;
    imageBase64: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const [created] = await db
    .insert(analyses)
    .values({ symbol, timeframe, imageBase64, status: "pending" })
    .returning();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ANALYSIS_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw);

    const [updated] = await db
      .update(analyses)
      .set({
        status: "complete",
        trend: result.trend,
        trendStrength: result.trendStrength?.toString(),
        patterns: JSON.stringify(result.patterns ?? []),
        indicators: result.indicators,
        supportLevels: result.supportLevels,
        resistanceLevels: result.resistanceLevels,
        tradeDirection: result.tradeDirection,
        entryPrice: result.entryPrice,
        stopLoss: result.stopLoss,
        takeProfit1: result.takeProfit1,
        takeProfit2: result.takeProfit2,
        takeProfit3: result.takeProfit3,
        riskReward: result.riskReward,
        confidence: result.confidence?.toString(),
        confidenceLabel: result.confidenceLabel,
        explanation: result.explanation,
        strengths: JSON.stringify(result.strengths ?? []),
        weaknesses: JSON.stringify(result.weaknesses ?? []),
        risks: JSON.stringify(result.risks ?? []),
        invalidationLevel: result.invalidationLevel,
      })
      .where(eq(analyses.id, created!.id))
      .returning();

    res.status(201).json(mapAnalysis(updated!));
  } catch (err) {
    await db
      .update(analyses)
      .set({ status: "error" })
      .where(eq(analyses.id, created!.id));
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
    createdAt: row.createdAt.toISOString(),
  };
}

export default router;
