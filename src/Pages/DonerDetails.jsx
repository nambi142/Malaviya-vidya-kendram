import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../Pages/firebase";
import "../Css/DonorDetails.css";
import { useNavigate } from "react-router-dom";

const DonorDetails = () => {
  const [donors, setDonors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const donorsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "Doner-details"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const donorData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((donor) => donor.status?.toLowerCase() === "success");
      setDonors(donorData);
      setCurrentPage(1);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "-";
    return timestamp.toDate().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return "0";
    const num = Number(amount);
    return num.toLocaleString("en-IN");
  };

  const indexOfLast = currentPage * donorsPerPage;
  const indexOfFirst = indexOfLast - donorsPerPage;
  const currentDonors = donors.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(donors.length / donorsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="donor-container">
      <h2 className="donor-title">Successful Donor Transactions</h2>

      {donors.length === 0 ? (
        <p className="no-data">No successful donations yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="donor-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount (₹)</th>
                <th>Status</th>
                <th>Order ID</th>
                <th>Payment ID</th>
                <th>RRN Number</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentDonors.map((donor, index) => (
                <tr key={donor.id} className={index % 2 === 0 ? "even" : "odd"}>
                  <td>{donor.name || "—"}</td>
                  <td>₹ {formatAmount(donor.amount)}</td>
                  <td>
                    <span className={`status ${donor.status.toLowerCase()}`}>
                      {donor.status}
                    </span>
                  </td>
                  <td>{donor.orderId || donor.order_id || "N/A"}</td>
                  <td>{donor.paymentId || donor.payment_id || "N/A"}</td>
                  <td>{donor.rrnNumber || donor.rrn_number || donor.rrn || "N/A"}</td>
                  <td>{formatDate(donor.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            ⬅ Prev
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              className={`page-btn ${currentPage === index + 1 ? "active" : ""}`}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next ➡
          </button>
        </div>
      )}

      <button className="history-btn" onClick={() => navigate("/donorfailure")}>
        🚫 View Failed Transactions
      </button>
    </div>
  );
};

export default DonorDetails;
