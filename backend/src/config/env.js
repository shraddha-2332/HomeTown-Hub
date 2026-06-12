import dotenv from "dotenv";

dotenv.config();

export const env = {
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hometown-hub",
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || "hometown-hub-dev-secret",
  corsOrigin: process.env.CORS_ORIGIN || "*"
};
