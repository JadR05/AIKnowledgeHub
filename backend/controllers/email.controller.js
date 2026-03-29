import Subscription from "../models/subscription.model.js";
import { getPapersForUser } from "../services/paper.service.js";
import { sendEmail } from "../services/email.service.js";

export const processEmails = async (req, res, next) => {
    try {
        const users = await Subscription.find();

        for (const user of users) {
            const papers = await getPapersForUser(user);

            if (!papers.length) continue;

            await sendEmail(user.email, papers);
            user.lastEmailSent = new Date();
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: "Emails processed successfully"
        });

    } catch (error) {
        next(error);
    }
};