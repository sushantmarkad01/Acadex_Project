import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; 

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.email && form.password) {
      try {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        navigate("/dashboard");
      } catch (error) {
        let errorMessage = "An unexpected error occurred.";
        switch (error.code) {
          case "auth/invalid-credential":
          case "auth/user-not-found":
          case "auth/wrong-password":
            errorMessage = "❌ Invalid email or password. Please check your credentials and try again.";
            break;
          default:
            console.error("Firebase sign-in error:", error);
            break;
        }
        setError(errorMessage);
      }
    } else {
      setError("❌ Please enter both your email and password.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <img
          className="login-logo"
          src="https://iili.io/KoAVeZg.md.png"
          alt="App Logo"
        />
        <h1>
          Sign in to <span className="highlight">AcadeX</span>
        </h1>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="********"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="btn-primary">
          Sign In
        </button>
        
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Don’t have an account?{" "}
          <span
            style={{ color: "#075eec", cursor: "pointer" }}
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>
      </form>
    </div>
  );
}