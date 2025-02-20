import { useNavigate } from 'react-router-dom';

const MyList = () => {
  const navigate = useNavigate();

  const handleMyList = async () => {
    try {
      navigate("/myreservations");
    } catch (error) {
      console.error("실패:", error);
    }
  };

  return (
    <button className="mylist-btn" onClick={handleMyList}>내 예약 보기</button>
  );
};

export default MyList;
