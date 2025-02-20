import { useNavigate } from 'react-router-dom';

const API_BASE_URL = "http://localhost:8080";

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
      });
      
      sessionStorage.removeItem("user"); 
      navigate("/");
      window.location.reload();
      alert("로그아웃 성공")
    } catch (error) {
        alert(error);
      console.error("로그아웃 실패:", error);
    }
  };

  return (
    <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
  );
};

export default Logout;
