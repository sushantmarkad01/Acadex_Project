import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, provider, signInWithPopup } from "../firebase"; // Import provider and signInWithPopup

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("❌ Please enter both your email and password.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate("/dashboard");
    } catch (error) {
      let errorMessage = "❌ Invalid email or password. Please try again.";
      if (error.code !== "auth/invalid-credential") {
        console.error("Firebase sign-in error:", error);
        errorMessage = "An unexpected error occurred.";
      }
      setError(errorMessage);
    }
  };

  // Function to handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError("");
    try {
      await signInWithPopup(auth, provider);
      // After successful sign-in, the onAuthStateChanged in Dashboard.js will trigger
      // and redirect to the correct dashboard. For now, we can just navigate.
      navigate("/dashboard");
    } catch (error) {
      setError(`❌ Google Sign-In Error: ${error.message}`);
      console.error("Google Sign-in error:", error);
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
        <h1>Sign in to <span className="highlight">AcadeX</span></h1>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="********"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="btn-primary">Sign In</button>
      </form>
      
      <div className="separator">OR</div>

      {/* Google Sign-In Button (Temporary for Super Admin) */}
      <button onClick={handleGoogleSignIn} className="btn-google">
        <i className="fab fa-google"></i> Sign in with Google
      </button>

      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Want to use AcadeX for your institute?{" "}
        <span
          style={{ color: "#075eec", cursor: "pointer" }}
          onClick={() => navigate("/apply")}
        >
          Apply here
        </span>
      </p>
    </div>
  );
}