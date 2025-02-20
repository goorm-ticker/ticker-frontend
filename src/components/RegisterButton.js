import { useNavigate } from 'react-router-dom';

const RegisterButton = () => {
  const navigate = useNavigate();

  const handleRegister = async () => {
    navigate("/register");
  };

  return (
    <button className="register-btn" onClick={handleRegister}>회원가입</button>
  );
};

export default RegisterButton;
