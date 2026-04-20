import express from "express";
import {PORT} from "./config/env.js";
import paperRouter from "./routes/paper.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

app.use("/papers", paperRouter);
app.use("/subscriptions", subscriptionRouter);

app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`AIKnowledgeHub API is running on port http://localhost:${PORT}`);
});