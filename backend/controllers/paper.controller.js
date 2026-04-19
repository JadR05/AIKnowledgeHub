import {fetchPapers, fetchPaperById} from "../db/papers.repo.js";

export const getPapers = async (req, res, next) => {
  try {
    const { topic, limit = 10 } = req.query;

    const topicsArray = topic
      ? topic.split(",").map((t) => t.trim())
      : [];

    const papers = await fetchPapers({
      topics: topicsArray,
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      count: papers.length,
      data: papers,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaper = async (req, res, next) => {
  try {
    const paper = await fetchPaperById(req.params.id);

    if (!paper) {
      const error = new Error('Paper not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: paper,
    });
  } catch (error) {
    next(error);
  }
};