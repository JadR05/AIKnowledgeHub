// routes/scraper.routes.js

import { Router } from "express";
import { triggerScraper } from "../controllers/scraper.controller.js";

const scraperRouter = Router();

scraperRouter.post("/run", triggerScraper);

export default scraperRouter;