// src/firebase/donationHandler.js
import { addDoc, collection } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Save donation to Firestore safely
 * @param {Object} order - The order object returned from backend
 */
export async function saveDonation(order) {
  try {
    if (!order) throw new Error("No order data received");

    // Extract fields safely
    const orderId = order.id || null; // null is allowed in Firestore
    const amount = order.amount || 0;
    const name = order.name || "Anonymous";

    // Save to Firestore
    const docRef = await addDoc(collection(db, "Doner-details"), {
      orderId,
      amount,
      name,
      createdAt: new Date(), // store timestamp
    });

    console.log("Donation saved with ID:", docRef.id);
    alert("Donation processed successfully!");
    return docRef.id;
  } catch (error) {
    console.error("Error processing donation:", error);
    alert("Failed to process donation. Try again.");
    return null;
  }
}
