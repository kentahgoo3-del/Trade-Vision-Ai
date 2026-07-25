import { Router } from "express";
import { db } from "@workspace/db";
import { analyses, journalEntries, watchlistItems } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/summary", async (_req, res) => {
  const [trades, allAnalyses, watchlist] = await Promise.all([
    db.select().from(journalEntries),
    db.select().from(analyses),
    db.select().from(watchlistItems),
  ]);

  const closed = trades.filter((t) => t.outcome !== null);
  const wins = closed.filter((t) => t.outcome === "win").length;
  const totalPnl = closed.reduce((sum, t) => sum + parseFloat(t.pnl ?? "0"), 0);
  const rrValues = closed.filter((t) => t.riskReward).map((t) => parseFloat(t.riskReward!));
  const avgRr = rrValues.length ? rrValues.reduce((s, v) => s + v, 0) / rrValues.length : 0;

  res.json({
    totalTrades: trades.length,
    winRate: closed.length ? Math.round((wins / closed.length) * 100) : 0,
    totalPnl: Math.round(totalPnl * 100) / 100,
    avgRiskReward: Math.round(avgRr * 100) / 100,
    sharpeRatio: null,
    totalAnalyses: allAnalyses.length,
    watchlistCount: watchlist.length,
  });
});

router.get("/equity-curve", async (_req, res) => {
  const trades = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.outcome, "win"))
    .orderBy(journalEntries.tradeDate);

  let equity = 10000;
  const curve = trades
    .filter((t) => t.pnl !== null)
    .map((t) => {
      const pnl = parseFloat(t.pnl!);
      equity += pnl;
      return {
        date: t.tradeDate.toISOString().split("T")[0],
        equity: Math.round(equity * 100) / 100,
        pnl: Math.round(pnl * 100) / 100,
      };
    });

  if (!curve.length) {
    res.json([{ date: new Date().toISOString().split("T")[0], equity: 10000, pnl: 0 }]);
  } else {
    res.json(curve);
  }
});

router.get("/monthly-performance", async (_req, res) => {
  const trades = await db.select().from(journalEntries);
  const monthly: Record<string, { pnl: number; trades: number; wins: number }> = {};

  for (const t of trades) {
    const month = t.tradeDate.toISOString().slice(0, 7);
    if (!monthly[month]) monthly[month] = { pnl: 0, trades: 0, wins: 0 };
    monthly[month]!.trades++;
    monthly[month]!.pnl += parseFloat(t.pnl ?? "0");
    if (t.outcome === "win") monthly[month]!.wins++;
  }

  const result = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      pnl: Math.round(data.pnl * 100) / 100,
      trades: data.trades,
      winRate: data.trades ? Math.round((data.wins / data.trades) * 100) : 0,
    }));

  res.json(result);
});

export default router;
