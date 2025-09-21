import pkg from "pg";
const { Pool } = pkg;
import env from "dotenv";

env.config();

export const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
  // ssl: {
  //   rejectUnauthorized: false, // Required for Neon on Vercel
  // },
});
