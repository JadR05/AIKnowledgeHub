import express from "express";
import {PORT} from "./config/env.js";
import paperRouter from "./routes/paper.routes.js";
import emailRouter from "./routes/email.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import scraperRouter from "./routes/scraper.routes.js";
import connectToDatabase from "./database/mongodb.js";
import errorMiddleware from "./middleware/error.middleware.js";


const app = express();

app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

app.use("/papers", paperRouter);
app.use("/subscriptions", subscriptionRouter);
app.use("/email", emailRouter);
app.use("/scraper", scraperRouter);
app.use(errorMiddleware);

app.get('/', (req,res) => {
    res.send("Welcome to the AIKnowledgeHub API!");
});

app.listen(PORT, async () => {
    console.log(`AIKnowledgeHub API is running on port http://localhost:${PORT}`);
    await connectToDatabase();
});