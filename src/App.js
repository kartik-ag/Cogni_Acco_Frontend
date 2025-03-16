import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TicketingPage from "./components/Ticketing/Ticketing.jsx";
import AlloterPage from "./components/Alloter/Allot.jsx";
import ControlsPage from "./components/Controls/ControlAlloter.jsx";
import Landing from "./components/Landing/Landing.jsx";
import Login from "./components/Login/Login.jsx";
import ExcelUpload from "./components/ExcelUpload/ExcelUpload.jsx";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/ticketing" element={<TicketingPage />} />
        <Route path="/alloter" element={<AlloterPage />} />
        <Route path="/controls" element={<ControlsPage />} />
        <Route path="/" element={<Login />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/excel-upload" element={<ExcelUpload />} /> {/* Correct */}
      </Routes>
    </Router>
  );
}
export default App;