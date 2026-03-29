import Paper from '../models/paper.model.js'

/*
export const getPapers = async (req, res, next) => {
  try {
    const papers = await Paper.find();

    res.status(200).json({ 
      success: true, 
      data: papers 
    });
  } catch (error) {
      next(error);
  }
}
*/
export const getPapers = async (req, res, next) => {
  try {
    const { topic, page = 1, limit = 10, sortBy = "createdAt" } = req.query;

    let filter = {};

    // Multi-topic filtering
    if (topic) {
      const topicsArray = topic.split(",").map(t => t.trim());
      filter.topic = { $in: topicsArray };
    }

    // Sorting logic
    let sortOption = {};

    if (sortBy === "views") {
      sortOption = { views: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const papers = await Paper.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: papers.length,
      data: papers
    });

  } catch (error) {
    next(error);
  }
};

// NOTE: Each request increments views.
// Refreshing the page will increase the count multiple times.
// We will fix it later
export const getPaper = async (req, res, next) => {
    try {
    const paper = await Paper.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } }, // 
      { new: true } 
    );

    if (!paper) {
      const error = new Error('Paper not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: paper });
  } catch (error) {
      next(error);
  }
}