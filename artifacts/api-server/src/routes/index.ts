import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysesRouter from "./analyses";
import watchlistRouter from "./watchlist";
import journalRouter from "./journal";
import portfolioRouter from "./portfolio";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/analyses", analysesRouter);
router.use("/watchlist", watchlistRouter);
router.use("/journal", journalRouter);
router.use("/portfolio", portfolioRouter);
router.use("/openai", openaiRouter);

export default router;
