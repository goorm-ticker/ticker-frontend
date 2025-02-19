import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const API_BASE_URL = "http://localhost:8080";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        alert(`로그인 실패: ${errorMessage || "알 수 없는 오류"}`);
        return;
      }
      alert("로그인 성공!");
      sessionStorage.setItem("user", "user");
      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error("로그인 오류:", error);
      setError(error);
      alert("네트워크 오류로 인해 로그인에 실패했습니다.");
    }
  };

  const goSignUp = async () => {
    try {
      navigate("/register");
    } catch (error) {
      console.error("이동 오류:", error);
    }
  };

  return (
    <div className="container">
      <h2>로그인</h2>
      {error && <p className="error-message">{error}</p>}
      <input type="text" name="loginId" placeholder="아이디" onChange={handleChange} className="input-box"/>
      <input type="password" name="password" placeholder="비밀번호" onChange={handleChange} className="input-box"/>
      <button className="primary" onClick={handleLogin}>로그인</button>
      <button className="move-btn" onClick={goSignUp}>회원가입 페이지로 이동</button>
    </div>
  );
};

export default Login;
