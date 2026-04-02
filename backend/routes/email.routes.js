import express from "express";
import { processEmails } from "../controllers/email.controller.js";

const emailRouter = express.Router();

emailRouter.post("/send", processEmails);

export default emailRouter;