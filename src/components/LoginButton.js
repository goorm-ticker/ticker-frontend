import { useNavigate } from 'react-router-dom';



const LoginButton = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    navigate("/login");
  };

  return (
    <button className="login-btn" onClick={handleLogin}>로그인</button>
  );
};

export default LoginButton;
