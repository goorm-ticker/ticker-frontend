import React from "react";
import { useNavigate } from "react-router-dom";
import LoginButton from "./LoginButton";
import RegisterButton from "./RegisterButton";
import Logout from "./Logout";
import MyreservationButton from "./MyreservationButton";
import '../App.css';

const Header = ({ isAuthenticated }) => {
  const navigate = useNavigate();

  return (
    <div className="header">
      <h1 className="header-title" onClick={() => navigate("/")}>Ticker</h1>
      <div className="header-buttons">
        {!isAuthenticated && <LoginButton className="login-btn" />}
        {!isAuthenticated && <RegisterButton className="register-btn" />}
        {isAuthenticated && <Logout className="logout-btn" />}
        {isAuthenticated && <MyreservationButton className="mylist-btn" />}
      </div>
    </div>
  );
};

export default Header;
