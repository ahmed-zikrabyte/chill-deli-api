import { ENV } from "./env";

const userUrl = ENV.app.userUrl;
const adminUrl = ENV.app.adminUrl;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  userUrl,
  adminUrl,
];

export { allowedOrigins, userUrl, adminUrl };
