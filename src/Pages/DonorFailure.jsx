import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../Pages/firebase";
import "../Css/DonorDetails.css"; 
import { useNavigate } from "react-router-dom";

const DonorFailure = () => {
  const [failedDonors, setFailedDonors] = useState([]);
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
        .filter((donor) => {
          const status = donor.status?.toLowerCase();
          return status === "failure" || status === "initiated";
        });
      setFailedDonors(donorData);
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

  const indexOfLast = currentPage * donorsPerPage;
  const indexOfFirst = indexOfLast - donorsPerPage;
  const currentDonors = failedDonors.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(failedDonors.length / donorsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="donor-container">
      <h2 className="donor-title">Failed / Pending Transactions</h2>

      {failedDonors.length === 0 ? (
        <p className="no-data">No failed or pending donations yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="donor-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount (₹)</th>
                <th>Status</th>
                <th>Order ID</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentDonors.map((donor, index) => (
                <tr key={donor.id} className={index % 2 === 0 ? "even" : "odd"}>
                  <td>{donor.name || "—"}</td>
                  <td>₹ {donor.amount || "0"}</td>
                  <td>
                    <span
                      className={`status ${
                        donor.status?.toLowerCase() === "failure" ? "failure" : "pending"
                      }`}
                    >
                      {donor.status}
                    </span>
                  </td>
                  <td>{donor.orderId || donor.order_id || "N/A"}</td>
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

      <button className="history-btn" onClick={() => navigate("/donordetails")}>
        ✅ View Successful Transactions
      </button>
    </div>
  );
};

export default DonorFailure;
