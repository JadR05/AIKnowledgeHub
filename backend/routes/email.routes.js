import express from "express";
import { processEmails } from "../controllers/email.controller.js";

const emailRouter = express.Router();

router.post("/send", processEmails);

export default emailRouter;