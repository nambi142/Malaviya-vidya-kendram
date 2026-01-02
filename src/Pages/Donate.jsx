import React, { useState, useEffect } from "react";
import "../Css/Donate.css";
import { db } from "./firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { createOrder, fetchRRN } from "../service";
import { Helmet } from "react-helmet-async";

const Donate = () => {
  const [formData, setFormData] = useState({
    amount: "",
    email: "",
    phone: "",
    name: "",
    pan: "",
    address: "",
  });

  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const navigate = useNavigate();

  // -------------------- Load Razorpay Script --------------------
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    script.onerror = () => setIsRazorpayLoaded(false);
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  // -------------------- Countdown Timer --------------------
  useEffect(() => {
    let timer;
    if (isLoadingPayment && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isLoadingPayment, countdown]);

  // -------------------- Helpers --------------------
  const formatIndianCurrency = (value) => {
    if (!value) return "";
    const num = value.replace(/\D/g, "").slice(0, 10);
    return new Intl.NumberFormat("en-IN").format(Number(num));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "amount") {
      setFormData((p) => ({
        ...p,
        amount: formatIndianCurrency(value),
      }));
    } else if (name === "pan") {
      setFormData((p) => ({ ...p, pan: value.toUpperCase().slice(0, 10) }));
    } else if (name === "phone") {
      setFormData((p) => ({
        ...p,
        phone: value.replace(/\D/g, "").slice(0, 10),
      }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      email: "",
      phone: "",
      name: "",
      pan: "",
      address: "",
    });
  };

  // -------------------- Submit --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded");
      return;
    }

    const cleanAmount = formData.amount.replace(/,/g, "");

    try {
      setIsLoadingPayment(true);
      setCountdown(15);
      document.body.style.overflow = "hidden";

      // ✅ Create Order
      const order = await createOrder(cleanAmount);
      console.log("✅ Order created:", order);

      const orderId = order?.id || order?.orderId;
      if (!orderId) throw new Error("Order ID missing");

      // ✅ SAVE INITIATED DATA
      const docRef = await addDoc(collection(db, "Doner-details"), {
        ...formData,
        amount: Number(cleanAmount),
        status: "initiated",
        orderId,
        date: new Date(),
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Malaviya Vidyalaya Kendram",
        description: "School Donation",
        order_id: orderId,

        handler: async (response) => {
          try {
            const rrnData = await fetchRRN(response.razorpay_payment_id);
            const rrnNumber = rrnData?.rrnNumber || "NA";

            await setDoc(
              doc(db, "Doner-details", docRef.id),
              {
                status: "success",
                paymentId: response.razorpay_payment_id,
                orderId,
                rrnNumber,
                date: new Date(),
              },
              { merge: true }
            );

            alert(`🎉 Payment Successful\nRRN: ${rrnNumber}`);
          } catch (err) {
            console.error(err);

            await setDoc(
              doc(db, "Doner-details", docRef.id),
              {
                status: "success",
                paymentId: response.razorpay_payment_id,
                orderId,
                rrnNumber: "NA",
                date: new Date(),
              },
              { merge: true }
            );

            alert("Payment successful. RRN not available.");
          } finally {
            document.body.style.overflow = "auto";
            resetForm();
          }
        },

        modal: {
          ondismiss: async () => {
            await setDoc(
              doc(db, "Doner-details", docRef.id),
              {
                status: "failure",
                date: new Date(),
              },
              { merge: true }
            );
            document.body.style.overflow = "auto";
          },
        },

        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#3399cc" },
      };

      new window.Razorpay(options).open();
      setIsLoadingPayment(false);
    } catch (err) {
      console.error("❌ Donation Error:", err);
      alert("Failed to process donation. Try again.");
      setIsLoadingPayment(false);
      document.body.style.overflow = "auto";
    }
  };

  // -------------------- JSX (UNCHANGED) --------------------
  return (
    <div className="donation-container">
      <Helmet>
        <title>
          Donate | Malaviya Vidyalaya Kendram Uvari - Support Rural Education
        </title>
      </Helmet>

      {isLoadingPayment ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <p>Please wait... Opening payment in {countdown} seconds ⏳</p>
        </div>
      ) : (
        <>
          <div className="donation-info">
            <div className="org-logo">
              <img
                src="/assets/Blue and Brown Illustrative School Logo.png"
                alt="Malaviya Vidyalaya Kendram Logo"
              />
            </div>
            <h2 className="org-name">Malaviya Vidyalaya Kendram</h2>
            <h3 className="donation-title">Donate to Educate</h3>
            <p className="donation-text">
              We would like to support the Malaviya Vidyalaya Kendram as a small
              effort to express our gratitude for everything we’ve been blessed
              with!
            </p>
            <div className="contact-box">
              <h4>Contact Us:</h4>
              <p>📧 malaviavidyakendram@gmail.com</p>
              <p>📞 Ph- 04637-210990</p>
            </div>
            <div className="terms">
              <h4>Terms & Conditions:</h4>
              <p>
                You agree to share information entered on this page with
                Malaviya Vidyalaya Kendram and Razorpay, adhering to applicable
                laws.
              </p>
            </div>
            <button
              className="history-btn"
              onClick={() => navigate("/donordetails")}
            >
              📜 View Donor History
            </button>
          </div>

          <div className="donation-form">
            <h3>Payment Details</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="amount"
                placeholder="₹ Enter Amount"
                value={formData.amount}
                onChange={handleChange}
                required
                autoComplete="off"
                className="amount-input"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="pan"
                placeholder="PAN Number (e.g., AAAPA1234A)"
                value={formData.pan}
                onChange={handleChange}
                maxLength={10}
              />
              <textarea
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                required
              />
              <button type="submit">
                Pay ₹{formData.amount || "0.00"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Donate;
