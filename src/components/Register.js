import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const API_BASE_URL = "http://localhost:8080";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("회원가입 실패");

      alert("회원가입 성공! 로그인 해주세요.");
      sessionStorage.setItem("user", response.data);
      navigate("/login");
    } catch (error) {
      setError("회원가입에 실패했습니다.");
    }
  };

  const goLogin = async () => {
    try {
      navigate("/login");
    } catch (error) {
      console.error("이동 오류:", error);
    }
  };

  return (
    <div className="container">
      <h2>회원가입</h2>
      {error && <p className="error-message">{error}</p>}
      <input type="text" name="name" placeholder="이름" onChange={handleChange} className="input-box"/>
      <input type="text" name="loginId" placeholder="아이디" onChange={handleChange} className="input-box"/>
      <input type="password" name="password" placeholder="비밀번호" onChange={handleChange} className="input-box"/>
      <button className="primary" onClick={handleRegister}>회원가입</button>
      <button className="move-btn" onClick={goLogin}>로그인 페이지로 이동</button>
    </div>
  );
};

export default Register;
