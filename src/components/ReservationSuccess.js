import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = "http://localhost:8080"; // API 엔드포인트

const ReservationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurant, date, time, partySize, reservationId } = location.state || {};

  if (!restaurant || !reservationId) {
    return <div>잘못된 접근입니다.</div>;
  }

  // 예약 취소 요청 함수
  const handleCancelReservation = async () => {
    const confirmCancel = window.confirm("정말 예약을 취소하시겠습니까?");
    if (!confirmCancel) return;

    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED"
        }),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("예약 취소에 실패했습니다.");
      }

      alert("예약이 취소되었습니다.");
      navigate("/"); // 메인 지도 페이지로 이동
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      alert("예약 취소 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>예약 완료</h2>
      <p><strong>{restaurant.restaurantName}</strong>에서 <strong>{date} {time}</strong>에 <strong>{partySize}명</strong> 예약되었습니다.</p>

      {/* 버튼 컨테이너 */}
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={handleCancelReservation}
          style={{
            backgroundColor: 'red',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            cursor: 'pointer',
            marginRight: '10px',
            borderRadius: '5px'
          }}
        >
          예약 취소
        </button>

        <button
          onClick={() => navigate('/')}
          style={{
            backgroundColor: 'blue',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px'
          }}
        >
          지도 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default ReservationSuccess;
