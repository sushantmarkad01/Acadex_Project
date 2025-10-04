import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './Login.css';

export default function CheckStatus() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    setMessage('');
    setStatus('');

    if (!email) {
      setStatus('error');
      setMessage('Please enter the email address you used to apply.');
      return;
    }

    try {
      const q = query(collection(db, "applications"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setStatus('error');
        setMessage('No application found with this email address.');
      } else {
        const appData = querySnapshot.docs[0].data();
        setStatus(appData.status);
        if (appData.status === 'approved') {
          setMessage('Congratulations! Your application has been approved. You will receive your login credentials from the super admin shortly.');
        } else if (appData.status === 'pending') {
          setMessage('Your application is still pending. Please check back later.');
        } else if (appData.status === 'denied') {
          setMessage('We regret to inform you that your application was not approved at this time.');
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while checking your status. Please try again.');
      console.error("Error checking status:", error);
    }
  };

  const getMessageClass = () => {
    switch (status) {
      case 'approved': return 'success-message';
      case 'error':
      case 'denied': return 'error-message';
      default: return 'info-message';
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <img className="login-logo" src="https://iili.io/KoAVeZg.md.png" alt="AcadeX Logo" />
        <h1>Check Application Status</h1>
      </div>
      <form className="login-form" onSubmit={handleCheckStatus}>
        <div className="input-group">
          <label>Application Email</label>
          <input
            type="email"
            placeholder="Enter the email used to apply"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        {message && <p className={getMessageClass()}>{message}</p>}

        <button type="submit" className="btn-primary">Check Status</button>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Back to{" "}
          <span style={{ color: "#075eec", cursor: "pointer" }} onClick={() => navigate("/")}>
            Sign In
          </span>
        </p>
      </form>
    </div>
  );
}