import { integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  direction: text("direction").notNull(),
  entryPrice: numeric("entry_price").notNull(),
  exitPrice: numeric("exit_price"),
  stopLoss: numeric("stop_loss"),
  takeProfit: numeric("take_profit"),
  positionSize: numeric("position_size"),
  pnl: numeric("pnl"),
  riskReward: numeric("risk_reward"),
  outcome: text("outcome"),
  strategy: text("strategy"),
  notes: text("notes"),
  chartImageBase64: text("chart_image_base64"),
  analysisId: integer("analysis_id"),
  tradeDate: timestamp("trade_date", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
});

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
