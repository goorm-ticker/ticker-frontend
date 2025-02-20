import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080";

const MyReservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/reservations`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("예약 내역을 불러오는 중 오류 발생");
        const data = await response.json();
        const activeReservations = data.filter(res => res.status !== "CANCELLED");
        setReservations(activeReservations);
      } catch (error) {
        setError("예약 정보를 가져오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handleCancel = async (reservationId) => {
    if (!window.confirm("정말 예약을 취소하시겠습니까?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
        method: "PATCH",
        headers: {
            "Content-Type" : "application/json",
        },
        body : JSON.stringify({ status : "CANCELLED" }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("예약 취소 실패");

      setReservations(reservations.filter((res) => res.reservationId !== reservationId));
      alert("예약이 취소되었습니다.");
    } catch (error) {
      alert("예약 취소 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="container">
      <h2>내 예약 내역</h2>
      {loading ? (
        <p>로딩 중...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : reservations.length === 0 ? (
        <p>예약 내역이 없습니다.</p>
      ) : (
        <ul className="reservation-list">
          {reservations.map((res) => (
            <li key={res.reservationId} className="reservation-item">
              <h3>{res.restaurantName}</h3>
              <p>📅 {res.reservationDate} 🕒 {res.reservationTime}</p>
              <p>👥 {res.partySize}명</p>
              <button className="cancel-btn" onClick={() => handleCancel(res.reservationId)}>
                예약 취소
              </button>
            </li>
          ))}
        </ul>
      )}
      <button className="primary" onClick={() => navigate("/")}>홈으로</button>
    </div>
  );
};

export default MyReservations;
