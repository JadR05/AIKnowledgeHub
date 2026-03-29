import {Router} from "express";
import {subscribeUser, getSubscribedUsers} from "../controllers/subscription.controller.js";

const subscriptionRouter = Router();

subscriptionRouter.post("/", subscribeUser);
subscriptionRouter.get("/", getSubscribedUsers);

export default subscriptionRouter;