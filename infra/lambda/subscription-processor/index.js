import { connectToDatabase } from "../shared/db.js";
import Subscription from "./models/subscription.model.js";
import Paper from "./models/paper.model.js";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});

const getPapersForUser = async (user) => {
  let filter = { topic: { $in: user.subscribedTopics } };

  if (user.lastEmailSent) {
    filter.createdAt = { $gt: user.lastEmailSent };
  }

  let papers = await Paper.find(filter).sort({ createdAt: -1 });

  if (!papers.length) {
    papers = await Paper.find({ topic: { $in: user.subscribedTopics } })
      .sort({ views: -1 })
      .limit(5);
  }

  return papers;
};

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectToDatabase();

    const users = await Subscription.find();

    for (const user of users) {
      const papers = await getPapersForUser(user);

      if (!papers.length) continue;

      await sqs.send(
        new SendMessageCommand({
          QueueUrl: process.env.EMAIL_QUEUE_URL,
          MessageBody: JSON.stringify({
            email: user.email,
            subscribedTopics: user.subscribedTopics,
            papers,
          }),
        })
      );

      user.lastEmailSent = new Date();
      await user.save();
    }

    return {
      statusCode: 200,
      body: { success: true },
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};