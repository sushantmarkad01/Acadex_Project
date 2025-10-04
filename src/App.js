import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import InstituteApplication from "./pages/InstituteApplication";
import CheckStatus from "./pages/CheckStatus";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import FreeTime from "./pages/FreeTime";
import Goals from "./pages/Goals";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/apply" element={<InstituteApplication />} />
        <Route path="/check-status" element={<CheckStatus />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/free-time" element={<FreeTime />} />
        <Route path="/goals" element={<Goals />} />
      </Routes>
    </Router>
  );
}

export default App;