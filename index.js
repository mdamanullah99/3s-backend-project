import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Configs
import { pool } from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";

// Middleware
import { errorHandler } from "./middlewares/errorMiddleware.js";

dotenv.config();
const currentNodeEnvironment = process.env.NODE_ENV;

const app = express();
const port = process.env.PORT || 3000;

// Required for working with file paths in ES modules
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

// Global error handler
app.use(errorHandler);

// Launch server
app.listen(port, () => {
  console.log(` Server running on http://localhost:${port}`);
});

// // ✅ Export for Vercel
// export default app;
