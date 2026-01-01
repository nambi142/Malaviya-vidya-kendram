import Razorpay from "razorpay";
import cors from "./_cors.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({ error: "paymentId is required" });
      }

      const payment = await razorpay.payments.fetch(paymentId);

      const rrn =
        payment.acquirer_data?.rrn ||
        payment.acquirer_data?.upi_transaction_id ||
        payment.acquirer_data?.bank_transaction_id ||
        "Not Available";

      res.status(200).json({
        paymentId: payment.id,
        orderId: payment.order_id,
        rrnNumber: rrn,
        amount: payment.amount / 100,
        method: payment.method,
        status: payment.status,
        createdAt: payment.created_at,
      });
    } catch (error) {
      console.error("❌ Fetch RRN error:", error);
      res.status(500).json({ error: "Failed to fetch payment details" });
    }
  });
}
