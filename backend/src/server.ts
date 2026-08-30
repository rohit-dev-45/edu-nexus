import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db";
import { serve } from "inngest/express";
import { functions, inngest } from "./inngest";

import userRoutes from "./routes/user";
import LogsRouter from "./routes/activitieslog";
import academicYearRouter from "./routes/academicYear";
import classRouter from "./routes/class";
import subjectRouter from "./routes/subject";
import timeRouter from "./routes/timetable";
import examRouter from "./routes/exam";
import dashboardRouter from "./routes/dashboard";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
app.use(cookieParser()); // Middleware to parse cookies

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

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

// import user routes
app.use("/api/users", userRoutes);
app.use("/api/activities", LogsRouter);
app.use("/api/academic-years", academicYearRouter);
app.use("/api/classes", classRouter);
app.use("/api/subjecjs", subjectRouter);
app.use("/api/timetables", timeRouter);
app.use("/api/exams", examRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((err: Error, req: Request, res: Response, next: Function) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
});

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server Is Running On http://localhost:${PORT}`);
    });
});
