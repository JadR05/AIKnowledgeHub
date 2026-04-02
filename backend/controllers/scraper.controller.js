// controllers/scraper.controller.js

import { runScraper } from "../services/scraper.service.js";

export const triggerScraper = async (req, res, next) => {
  try {
    // Call the service — this does all the actual work
    const results = await runScraper();

    res.status(200).json({
      success: true,
      message: "Scraper finished successfully",
      results, // Array of { category, topic, fetched, inserted, skipped }
    });

  } catch (error) {
    // Pass any unexpected error to error.middleware.js
    next(error);
  }
};