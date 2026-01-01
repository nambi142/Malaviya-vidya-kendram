import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173",

  // Netlify default domains
  "https://malaviyavidyakendram.netlify.app",
  "https://malaviyavidyakendramurvari.netlify.app",

  // Production custom domain
  "https://uvarimkv.org",
  "https://www.uvarimkv.org",
];

export default cors({
  origin(origin, callback) {
    // allow server-to-server & same-origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("🚫 CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
});
