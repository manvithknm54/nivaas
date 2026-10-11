import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import authRoutes from "./routes/auth.routes.js";
import ownerRoutes from "./routes/owner.routes.js";
import tenantRoutes from "./routes/tenant.routes.js";
import joinRoutes from "./routes/join.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();
app.set("trust proxy", 1); // needed behind Render/Vercel
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "nivaas" }));
app.use("/api/auth", authRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/join", joinRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(400).json({ message: err.issues[0].message });
  if (err.code === 11000) return res.status(409).json({ message: "That already exists" });
  if (err.name === "CastError") return res.status(400).json({ message: "Invalid id" });
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Please log in again" });
  }
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : "Something went wrong" });
});

export default app;