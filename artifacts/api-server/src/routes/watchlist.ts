import { Router } from "express";
import { db } from "@workspace/db";
import { watchlistItems } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const rows = await db.select().from(watchlistItems).orderBy(desc(watchlistItems.addedAt));
  res.json(rows.map(mapItem));
});

router.post("/", async (req, res) => {
  const { symbol, name, category, notes } = req.body as {
    symbol: string;
    name?: string;
    category: string;
    notes?: string;
  };
  if (!symbol || !category) { res.status(400).json({ error: "symbol and category required" }); return; }
  const [created] = await db.insert(watchlistItems).values({ symbol: symbol.toUpperCase(), name, category, notes }).returning();
  res.status(201).json(mapItem(created!));
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const result = await db.delete(watchlistItems).where(eq(watchlistItems.id, id)).returning();
  if (!result.length) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).send();
});

function mapItem(row: typeof watchlistItems.$inferSelect) {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    category: row.category,
    notes: row.notes,
    addedAt: row.addedAt.toISOString(),
  };
}

export default router;
