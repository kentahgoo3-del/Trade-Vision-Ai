import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ── Conversations ────────────────────────────────────────────────────────────

router.get("/conversations", async (_req, res) => {
  const rows = await db.select().from(conversations).orderBy(desc(conversations.createdAt));
  res.json(rows.map((r) => ({ id: r.id, title: r.title, createdAt: r.createdAt.toISOString() })));
});

router.post("/conversations", async (req, res) => {
  const { title } = req.body as { title: string };
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const [created] = await db.insert(conversations).values({ title }).returning();
  res.status(201).json({ id: created!.id, title: created!.title, createdAt: created!.createdAt.toISOString() });
});

router.get("/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  res.json({
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt.toISOString(),
    messages: msgs.map(mapMsg),
  });
});

router.delete("/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const result = await db.delete(conversations).where(eq(conversations.id, id)).returning();
  if (!result.length) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).send();
});

// ── Messages ─────────────────────────────────────────────────────────────────

router.get("/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id!);
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  res.json(msgs.map(mapMsg));
});

router.post("/conversations/:id/messages", async (req, res) => {
  const conversationId = parseInt(req.params.id!);
  const { content } = req.body as { content: string };
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  // Persist user message
  await db.insert(messages).values({ conversationId, role: "user", content });

  // Load conversation history
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  // Stream response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "You are TradeVision AI, an expert institutional-grade trading assistant. You provide professional technical analysis, market insights, risk management advice, and trading strategies. Be concise, precise, and actionable. Use professional trading terminology.",
      },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
  });

  let fullContent = "";
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (text) {
      fullContent += text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }

  // Persist assistant message
  await db.insert(messages).values({ conversationId, role: "assistant", content: fullContent });

  res.write("data: [DONE]\n\n");
  res.end();
});

function mapMsg(row: typeof messages.$inferSelect) {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

export default router;
