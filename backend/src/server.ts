import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { serve } from "inngest/express";
import { functions, inngest } from "./inngest";

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    }),
);

// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

// Health Check Route
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ status: "OK", message: "Server Is Healthy" });
});

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server Is Running On http://localhost:${PORT}`);
    });
});
