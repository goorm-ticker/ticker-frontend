import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Map from './components/Map';
import ReservationForm from './components/ReservationForm';
import ReservationSuccess from './components/ReservationSuccess';
import Register from './components/Register';
import Login from './components/Login';
import MyReservations from './components/Myreservations';
import Header from './components/Header'; 
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    setIsAuthenticated(!!user);
  }, []);

  return (
    <Router>
      <Header isAuthenticated={isAuthenticated} />
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="/reservation/:id" element={<ReservationForm />} />
        <Route path="/reservation-success" element={<ReservationSuccess />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/myreservations" element={<MyReservations />} />
      </Routes>
    </Router>
  );
}

export default App;
