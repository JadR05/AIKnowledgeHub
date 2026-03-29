import Subscription from '../models/subscription.model.js'

export const subscribeUser = async (req, res, next) => {
    try {
        const { email, subscribedTopics } = req.body;

        if (!email || !subscribedTopics || !subscribedTopics.length) {
            const error = new Error("Email and at least one topic are required");
            error.statusCode = 400;
            throw error;
        }

        const newUser = new Subscription({ email, subscribedTopics });
        await newUser.save();

        res.status(201).json({ 
            success: true, 
            message: "Subscription created successfully", 
            subscription: newUser 
        });
    } catch (error) {
        next(error);
    }
}

export const getSubscribedUsers = async (req, res, next) => {
    try {
    const subscribedUsers = await Subscription.find();

    res.status(200).json({ 
      success: true, 
      data: subscribedUsers
    });
  } catch (error) {
      next(error);
  }
}