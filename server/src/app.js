import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "nivaas" }));

app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ message: err.status ? err.message : "Something went wrong" });
});

export default app;