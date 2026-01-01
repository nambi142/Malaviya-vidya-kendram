import React, { useState, useEffect } from "react";
import "../Css/Donate.css";
import { db } from "./firebase"; 
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { createOrder, fetchRRN } from "../service";
import { Helmet } from "react-helmet-async"; // ✅ SEO Import

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

  // -------------------- Handlers --------------------
  const formatIndianCurrency = (value) => {
    if (!value) return "";
    const num = value.replace(/\D/g, "");
    if (!num) return "";
    const limited = num.slice(0, 10);
    return new Intl.NumberFormat("en-IN").format(Number(limited));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        amount: formatIndianCurrency(digitsOnly),
      }));
    } else if (name === "pan") {
      const panValue = value.toUpperCase().slice(0, 10);
      setFormData((prev) => ({ ...prev, pan: panValue }));
    } else if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
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

  const validateForm = () => {
    const { amount, email, phone, name, pan, address } = formData;
    const cleanAmount = amount.replace(/,/g, "");
    if (!cleanAmount || Number(cleanAmount) <= 0) {
      alert("⚠ Please enter a valid donation amount greater than 0.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("⚠ Please enter a valid email address.");
      return false;
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      alert("⚠ Please enter a valid 10-digit phone number.");
      return false;
    }
    if (name.trim().length < 3) {
      alert("⚠ Name must be at least 3 characters long.");
      return false;
    }
    if (pan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(pan)) {
        alert("⚠ Please enter a valid PAN number (e.g., AAAPA1234A).");
        return false;
      }
    }
    if (address.trim().length < 5) {
      alert("⚠ Please enter a valid address (minimum 5 characters).");
      return false;
    }
    return true;
  };

  // -------------------- Submit / Razorpay --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!validateForm()) return;
    if (!window.Razorpay) {
      alert("❌ Razorpay SDK not available. Please refresh and try again.");
      return;
    }

    const cleanAmount = formData.amount.replace(/,/g, "");
    try {
      setIsLoadingPayment(true);
      setCountdown(60);
      document.body.style.overflow = "hidden";

      const order = await createOrder(cleanAmount);
      console.log("✅ Order created via backend:", order);

      // ✅ Save initial order to Firestore safely
      const docRef = await addDoc(collection(db, "Doner-details"), {
        ...formData,
        amount: cleanAmount,
        date: new Date(),
        status: "initiated",
        orderId: order.id || null, // prevent undefined
      });

      setTimeout(() => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "Malaviya Vidyalaya Kendram - School Donation",
          description:
            "Support education for rural children in Uvari village, Tirunelveli.",
          order_id: order.id,
          handler: async function (response) {
            try {
              const rrnData = await fetchRRN(response.razorpay_payment_id);
              const rrnNumber = rrnData.rrnNumber || "Not Available";
              await setDoc(
                doc(db, "Doner-details", docRef.id),
                {
                  ...formData,
                  amount: cleanAmount,
                  date: new Date(),
                  status: "success",
                  rrnNumber,
                  paymentId: response.razorpay_payment_id,
                  orderId: order.id || null,
                },
                { merge: true }
              );
              alert("🎉 Payment Successful! RRN: " + rrnNumber);
            } catch (err) {
              console.error("❌ Error fetching RRN:", err);
              await setDoc(
                doc(db, "Doner-details", docRef.id),
                {
                  ...formData,
                  amount: cleanAmount,
                  date: new Date(),
                  status: "success",
                  paymentId: response.razorpay_payment_id,
                  orderId: order.id || null,
                },
                { merge: true }
              );
              alert("Payment successful but failed to fetch RRN.");
            } finally {
              document.body.style.overflow = "auto";
            }
          },
          modal: {
            ondismiss: async function () {
              await setDoc(
                doc(db, "Doner-details", docRef.id),
                {
                  ...formData,
                  amount: cleanAmount,
                  date: new Date(),
                  status: "failure",
                  orderId: order.id || null,
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
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
        setIsLoadingPayment(false);
        resetForm();
      }, 15000);
    } catch (error) {
      console.error("❌ Error processing donation:", error);
      alert("Failed to process donation. Try again.");
      setIsLoadingPayment(false);
      document.body.style.overflow = "auto";
    }
  };

  // -------------------- JSX --------------------
  return (
    <div className="donation-container">
      {/* ✅ SEO TAGS */}
      <Helmet>
        <title>Donate | Malaviya Vidyalaya Kendram Uvari - Support Rural Education</title>
        <meta
          name="description"
          content="Support Malaviya Vidyalaya Kendram, Uvari — a non-profit rural English medium school. Your donation helps provide education, meals, and resources to underprivileged children."
        />
        <meta
          name="keywords"
          content="Malaviya Vidyalaya Kendram, Uvari School, donate school, Tamil Nadu education, rural school, charity, Tirunelveli school, support education, India donation, help children study"
        />
        <meta name="author" content="Malaviya Vidyalaya Kendram School" />
        <meta property="og:title" content="Donate to Malaviya Vidyalaya Kendram - Support Rural Education" />
        <meta
          property="og:description"
          content="Make a difference. Donate to Malaviya Vidyalaya Kendram to support rural education in Uvari, Tirunelveli."
        />
        <meta property="og:image" content="/assets/Blue and Brown Illustrative School Logo.png" />
        <meta property="og:url" content="https://malaviyavidyakendramurvari.netlify.app/donate" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://malaviyavidyakendramurvari.netlify.app/donate" />
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
              <button type="submit">Pay ₹{formData.amount || "0.00"}</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Donate;
