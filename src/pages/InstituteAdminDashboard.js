import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";
import './Dashboard.css';

// Import the new components
import AddTeacher from './AddTeacher';
import AddStudent from './AddStudent';
import ManageUsers from './ManageUsers';

const DashboardHome = ({ instituteName }) => (
    <div className="content-section">
        <h2 className="content-title">Welcome, {instituteName || 'Admin'}!</h2>
        <p className="content-subtitle">
            Use the sidebar to manage teachers, add students, and view your institute's data.
        </p>
    </div>
);

export default function InstituteAdminDashboard() {
    const [adminInfo, setAdminInfo] = useState(null);
    const [activePage, setActivePage] = useState('dashboard');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAdminData = async () => {
            if (auth.currentUser) {
                const userDocRef = doc(db, "users", auth.currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setAdminInfo(userDoc.data());
                }
            }
        };
        fetchAdminData();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };
    
    const NavLink = ({ page, icon, label }) => (
      <li className={activePage === page ? 'active' : ''} onClick={() => {setActivePage(page); setIsMobileNavOpen(false);}}>
          <i className={`fas fa-${icon}`}></i> {/* Using FontAwesome icons */}
          <span>{label}</span>
      </li>
    );

    const renderContent = () => {
        if (!adminInfo) {
            return <div className="content-section"><p>Loading admin data...</p></div>;
        }
        
        const instituteName = adminInfo.instituteName || "Your Institute";
        const instituteId = adminInfo.instituteId;

        switch (activePage) {
            case 'dashboard':
                return <DashboardHome instituteName={instituteName} />;
            case 'addTeacher':
                return <AddTeacher instituteId={instituteId} />;
            case 'addStudent':
                return <AddStudent instituteId={instituteId} />;
            case 'manageUsers':
                return <ManageUsers instituteId={instituteId} />;
            default:
                return <DashboardHome instituteName={instituteName} />;
        }
    };

    return (
        <div className="dashboard-container">
            {isMobileNavOpen && <div className="nav-overlay" onClick={() => setIsMobileNavOpen(false)}></div>}
            <aside className={`sidebar ${isMobileNavOpen ? 'open' : ''}`}>
                <div className="logo-container">
                    <img src="https://iili.io/KoAVeZg.md.png" alt="AcadeX Logo" className="sidebar-logo"/>
                    <span className="logo-text">AcadeX</span>
                </div>
                <ul className="menu">
                    <NavLink page="dashboard" icon="tachometer-alt" label="Dashboard" />
                    <NavLink page="addTeacher" icon="user-plus" label="Add Teacher" />
                    <NavLink page="addStudent" icon="user-graduate" label="Add Student" />
                    <NavLink page="manageUsers" icon="users" label="Manage Users" />
                </ul>
                <div className="sidebar-footer">
                     <button onClick={handleLogout} className="logout-btn">
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
            <main className="main-content">
                 <header className="mobile-header">
                    <button className="hamburger-icon" onClick={() => setIsMobileNavOpen(true)}>&#9776;</button>
                    <div className="mobile-logo">AcadeX</div>
                </header>
                {renderContent()}
            </main>
        </div>
    );
}