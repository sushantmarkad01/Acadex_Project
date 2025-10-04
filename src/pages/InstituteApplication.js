import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InstituteApplication.css";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function InstituteApplication() {
  const [form, setForm] = useState({
    instituteName: "",
    contactName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.instituteName || !form.contactName || !form.email) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      await addDoc(collection(db, "applications"), {
        ...form,
        status: "pending",
        submittedAt: new Date(),
      });
      setSuccess("Application submitted! You can check your status on the status page.");
      setForm({
        instituteName: "",
        contactName: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error("Application submission error:", error);
    }
  };

  return (
    <div className="application-container">
      <div className="application-header">
        <img className="application-logo" src="https://iili.io/KoAVeZg.md.png" alt="AcadeX Logo" />
        <h1>Apply to use AcadeX</h1>
        <p className="subtitle">
          Submit your institute's application to get access to the Acadex platform.
        </p>
      </div>
      <form className="application-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Institute Name</label>
          <input
            type="text"
            placeholder="e.g., DVVPCOE"
            value={form.instituteName}
            onChange={(e) =>
              setForm({ ...form, instituteName: e.target.value })
            }
            required
          />
        </div>
        <div className="input-group">
          <label>Contact Person</label>
          <input
            type="text"
            placeholder="e.g., Sushant Markad"
            value={form.contactName}
            onChange={(e) =>
              setForm({ ...form, contactName: e.target.value })
            }
            required
          />
        </div>
        <div className="input-group">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="your-email@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="input-group">
          <label>Phone Number (Optional)</label>
          <input
            type="tel"
            placeholder="e.g., +1234567890"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label>Message (Optional)</label>
          <textarea
            placeholder="Tell us about your institute and why you'd like to use AcadeX."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          ></textarea>
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <button type="submit" className="btn-primary">
          Submit Application
        </button>

        <p style={{ marginTop: "15px", textAlign: "center" }}>
          Already applied?{" "}
          <span
            style={{ color: "#075eec", cursor: "pointer" }}
            onClick={() => navigate("/check-status")}
          >
            Check your status here
          </span>
        </p>

        <p style={{ marginTop: "15px", textAlign: "center" }}>
          Already have an account?{" "}
          <span
            style={{ color: "#075eec", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Sign In
          </span>
        </p>
      </form>
    </div>
  );
}