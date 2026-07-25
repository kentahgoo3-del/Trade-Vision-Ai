import { integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  symbol: text("symbol"),
  timeframe: text("timeframe"),
  chartType: text("chart_type"),
  imageBase64: text("image_base64"),
  status: text("status").notNull().default("pending"),
  // Core fields (kept for backwards compat + quick-list display)
  trend: text("trend"),
  trendStrength: numeric("trend_strength"),
  patterns: text("patterns"),
  indicators: text("indicators"),
  supportLevels: text("support_levels"),
  resistanceLevels: text("resistance_levels"),
  tradeDirection: text("trade_direction"),
  entryPrice: text("entry_price"),
  stopLoss: text("stop_loss"),
  takeProfit1: text("take_profit_1"),
  takeProfit2: text("take_profit_2"),
  takeProfit3: text("take_profit_3"),
  riskReward: text("risk_reward"),
  confidence: numeric("confidence"),
  confidenceLabel: text("confidence_label"),
  explanation: text("explanation"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  risks: text("risks"),
  invalidationLevel: text("invalidation_level"),
  // AI Decision Engine fields
  tradeDecision: text("trade_decision"),
  overallScore: integer("overall_score"),
  confidenceBreakdown: jsonb("confidence_breakdown"),
  tradePlan: jsonb("trade_plan"),
  scenarios: jsonb("scenarios"),
  marketPsychology: jsonb("market_psychology"),
  tradeChecklist: jsonb("trade_checklist"),
  multiTimeframe: jsonb("multi_timeframe"),
  riskBreakdown: jsonb("risk_breakdown"),
  tradeQualityStars: integer("trade_quality_stars"),
  coachAdvice: jsonb("coach_advice"),
  patternExplanations: jsonb("pattern_explanations"),
  beginnerExplanation: text("beginner_explanation"),
  newsSentiment: jsonb("news_sentiment"),
  // User-added metadata
  setupType: text("setup_type"),
  tradeOutcome: text("trade_outcome"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
