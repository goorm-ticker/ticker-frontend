import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';

const API_BASE_URL = "http://localhost:8080";

const ReservationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurant } = location.state || {};

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 예약 요청 상태 관리

  useEffect(() => {
    if (!restaurant) return;

    const fetchSlots = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/restaurants/${restaurant.restaurantId}/slots`);
        if (!response.ok) throw new Error("시간대를 불러오는 중 오류 발생");
        const data = await response.json();
        setSlots(data);
      } catch (error) {
        setError("예약 가능한 시간대를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [restaurant]);

  if (!restaurant) {
    return <div className="container">잘못된 접근입니다.</div>;
  }

  const handleReservation = async () => {
    if (!date || !time) {
      alert("예약 날짜와 시간을 선택하세요.");
      return;
    }

    const reservationData = {
      userId: 1, // TODO: 세션에서 실제 사용자 ID 가져와야 함
      restaurantId: restaurant.restaurantId,
      reservationDate: date,
      reservationTime: time,
      partySize: partySize,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("예약 요청에 실패했습니다.");
      }

      const responseData = await response.json();

      navigate('/reservation-success', { 
        state: {
            userId:  
          restaurant, 
          date, 
          time, 
          partySize,
          reservationId: responseData.reservationId 
        } 
      });
    } catch (error) {
      console.error("예약 요청 실패:", error);
      alert("예약 요청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h2>{restaurant.restaurantName} 예약</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="form-group">
      <label>예약 날짜:</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-box"/> 
        </div>
        <div className="form-group">
      <label>예약 시간:</label>
      <div className="time-slot-container">
        {loading ? (
          <p>로딩 중...</p>
        ) : slots.length > 0 ? (
          slots.map((slot, index) => (
            <button
              key={index}
              className={`time-slot-btn ${time === slot.startTime ? "active" : ""}`}
              onClick={() => setTime(slot.startTime)}
            >
              {slot.startTime}
            </button>
          ))
        ) : (
          <p>예약 가능한 시간이 없습니다.</p>
        )}
      </div>
      </div>
      <div className='form-group'>
      <label>예약 인원:</label>
      <input className="input-box" type="number" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} min="1" max={restaurant.availablePartySize} />
        </div>
      <button className="primary" onClick={handleReservation} disabled={isSubmitting || !date || !time}>
        {isSubmitting ? "예약 요청 중..." : "예약 요청"}
      </button>
    </div>
  );
};

export default ReservationForm;
