// src/service.js
import axios from "axios";

// ✅ Vercel backend base URL
// Uses .env in production, fallback for safety
const API_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://malaviyavidyakendramurvari.vercel.app/api";

/**
 * ✅ Create Razorpay order via backend
 * @param {number} amount - Amount in rupees
 * @returns {object} - { orderId, amount, currency }
 */
export const createOrder = async (amount) => {
  try {
    if (!amount || isNaN(amount)) {
      throw new Error("Invalid donation amount");
    }

    const response = await axios.post(`${API_URL}/create-order`, { amount });
    return response.data;
  } catch (error) {
    console.error(
      "❌ Error creating order:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * ✅ Fetch RRN (Bank Reference Number) using Razorpay paymentId
 * @param {string} paymentId - Razorpay payment ID
 * @returns {object}
 */
export const fetchRRN = async (paymentId) => {
  try {
    if (!paymentId) {
      throw new Error("Missing paymentId");
    }

    const response = await axios.post(`${API_URL}/fetch-rrn`, { paymentId });
    return response.data;
  } catch (error) {
    console.error(
      "❌ Error fetching RRN:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * ✅ Check backend connectivity (health check)
 * Useful for debugging & monitoring
 */
export const checkBackendConnection = async () => {
  try {
    const response = await axios.get(API_URL);
    console.log("✅ Backend connected:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Backend connection failed:", error.message);
    throw error;
  }
};                 
