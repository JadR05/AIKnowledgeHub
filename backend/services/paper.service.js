import Paper from "../models/paper.model.js";

export const getPapersForUser = async (user) => {
    let filter = {
        topic: { $in: user.subscribedTopics }
    };

    if (user.lastEmailSent) {
        filter.createdAt = { $gt: user.lastEmailSent };
    }

    let papers = await Paper.find(filter).sort({ createdAt: -1 });

    if (!papers.length) {
        papers = await Paper.find({
            topic: { $in: user.subscribedTopics }
        })
        .sort({ views: -1 })
        .limit(5);
    }

    return papers;
};