import React from 'react';
import { signOut } from 'firebase/auth';
// FIX: Corrected import path. Assumes firebase.js is in the parent 'src/' directory.
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
// FIX: Corrected import path. Assumes Dashboard.css is in the parent 'src/' directory.
import './Dashboard.css';

// This is a placeholder component for the new admin role.
// We will build out its features like "Add Teacher" and "Bulk Import Students" in the next steps.
export default function InstituteAdminDashboard() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="logo-container">
                    <img src="https://iili.io/KoAVeZg.md.png" alt="AcadeX Logo" className="sidebar-logo"/>
                    <span className="logo-text">AcadeX</span>
                </div>
                <ul className="menu">
                    <li className="active">
                        <i className="icon-dashboard"></i>
                        <span>Dashboard</span>
                    </li>
                    {/* More admin features will be added here */}
                </ul>
                <div className="sidebar-footer">
                     <button onClick={handleLogout} className="logout-btn">
                        <i className="icon-logout"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
            <main className="main-content">
                 <header className="mobile-header">
                    <button className="hamburger-icon" onClick={() => { /* Logic to open mobile nav will be added */ }}>&#9776;</button>
                    <div className="mobile-logo">AcadeX</div>
                </header>
                <div className="content-section">
                    <h2 className="content-title">Institute Admin Dashboard</h2>
                    <p className="content-subtitle">Welcome! This is where you will manage your institute's teachers, students, and view analytics.</p>
                </div>
            </main>
        </div>
    );
}

