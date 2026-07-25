import { Router } from "express";
import { db } from "@workspace/db";
import { journalEntries } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const rows = await db.select().from(journalEntries).orderBy(desc(journalEntries.tradeDate));
  res.json(rows.map(mapEntry));
});

router.get("/stats", async (_req, res) => {
  const rows = await db.select().from(journalEntries);
  const closed = rows.filter((r) => r.outcome !== null);
  const wins = closed.filter((r) => r.outcome === "win").length;
  const losses = closed.filter((r) => r.outcome === "loss").length;
  const breakevens = closed.filter((r) => r.outcome === "breakeven").length;
  const totalPnl = closed.reduce((sum, r) => sum + parseFloat(r.pnl ?? "0"), 0);
  const pnlValues = closed.map((r) => parseFloat(r.pnl ?? "0"));
  const bestTrade = pnlValues.length ? Math.max(...pnlValues) : null;
  const worstTrade = pnlValues.length ? Math.min(...pnlValues) : null;
  const avgPnl = closed.length ? totalPnl / closed.length : 0;
  const rrValues = closed.filter((r) => r.riskReward).map((r) => parseFloat(r.riskReward!));
  const avgRiskReward = rrValues.length ? rrValues.reduce((s, v) => s + v, 0) / rrValues.length : 0;
  res.json({
    totalTrades: rows.length,
    winCount: wins,
    lossCount: losses,
    breakevenCount: breakevens,
    winRate: closed.length ? Math.round((wins / closed.length) * 100) : 0,
    avgRiskReward: Math.round(avgRiskReward * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100,
    bestTrade,
    worstTrade,
    avgPnl: Math.round(avgPnl * 100) / 100,
    sharpeRatio: null,
  });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const [row] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(mapEntry(row));
});

router.post("/", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const [created] = await db
    .insert(journalEntries)
    .values({
      symbol: String(body.symbol).toUpperCase(),
      direction: String(body.direction) as "long" | "short",
      entryPrice: String(body.entryPrice),
      exitPrice: body.exitPrice != null ? String(body.exitPrice) : undefined,
      stopLoss: body.stopLoss != null ? String(body.stopLoss) : undefined,
      takeProfit: body.takeProfit != null ? String(body.takeProfit) : undefined,
      positionSize: body.positionSize != null ? String(body.positionSize) : undefined,
      pnl: body.pnl != null ? String(body.pnl) : undefined,
      riskReward: body.riskReward != null ? String(body.riskReward) : undefined,
      outcome: (body.outcome as "win" | "loss" | "breakeven" | undefined) ?? undefined,
      strategy: body.strategy as string | undefined,
      notes: body.notes as string | undefined,
      chartImageBase64: body.chartImageBase64 as string | undefined,
      analysisId: body.analysisId as number | undefined,
      tradeDate: body.tradeDate ? new Date(String(body.tradeDate)) : new Date(),
    })
    .returning();
  res.status(201).json(mapEntry(created!));
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const body = req.body as Record<string, unknown>;
  const updateData: Record<string, unknown> = {};
  if (body.exitPrice != null) updateData.exitPrice = String(body.exitPrice);
  if (body.stopLoss != null) updateData.stopLoss = String(body.stopLoss);
  if (body.takeProfit != null) updateData.takeProfit = String(body.takeProfit);
  if (body.positionSize != null) updateData.positionSize = String(body.positionSize);
  if (body.pnl != null) updateData.pnl = String(body.pnl);
  if (body.riskReward != null) updateData.riskReward = String(body.riskReward);
  if (body.outcome != null) updateData.outcome = body.outcome;
  if (body.strategy != null) updateData.strategy = body.strategy;
  if (body.notes != null) updateData.notes = body.notes;

  const [updated] = await db.update(journalEntries).set(updateData).where(eq(journalEntries.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(mapEntry(updated));
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const result = await db.delete(journalEntries).where(eq(journalEntries.id, id)).returning();
  if (!result.length) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).send();
});

function mapEntry(row: typeof journalEntries.$inferSelect) {
  return {
    id: row.id,
    symbol: row.symbol,
    direction: row.direction,
    entryPrice: row.entryPrice ? parseFloat(row.entryPrice) : 0,
    exitPrice: row.exitPrice ? parseFloat(row.exitPrice) : null,
    stopLoss: row.stopLoss ? parseFloat(row.stopLoss) : null,
    takeProfit: row.takeProfit ? parseFloat(row.takeProfit) : null,
    positionSize: row.positionSize ? parseFloat(row.positionSize) : null,
    pnl: row.pnl ? parseFloat(row.pnl) : null,
    riskReward: row.riskReward ? parseFloat(row.riskReward) : null,
    outcome: row.outcome ?? null,
    strategy: row.strategy,
    notes: row.notes,
    chartImageBase64: row.chartImageBase64,
    analysisId: row.analysisId,
    tradeDate: row.tradeDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export default router;
