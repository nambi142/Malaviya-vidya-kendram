import cors from "./_cors.js";

export default function handler(req, res) {
  cors(req, res, () => {
    res.status(200).json({
      success: true,
      message: "✅ Backend is connected successfully 🚀",
      time: new Date().toISOString(),
    });
  });
}
