import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './Dashboard.css';
import FreePeriodTasks from './FreePeriodTasks'; 

const BACKEND_URL = "https://acadex-backend-n2wh.onrender.com";

const DashboardHome = ({ user }) => {
    const [liveSession, setLiveSession] = useState(null);
    const [scanMessage, setScanMessage] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!user || !user.instituteId) {
            return;
        }

        const q = query(
            collection(db, "live_sessions"), 
            where("isActive", "==", true),
            where("instituteId", "==", user.instituteId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setLiveSession({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            } else {
                setLiveSession(null);
            }
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        let scanner;
        if (showScanner) {
            scanner = new Html5QrcodeScanner("qr-reader", { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
            scanner.render((decodedText) => {
                setShowScanner(false);
                handleScan(decodedText);
            }, () => {});
        }
        return () => {
            if (scanner && scanner.getState() !== 2) {
                scanner.clear().catch(err => console.error("Scanner clear failed.", err));
            }
        };
    }, [showScanner]);
    
    const handleScan = (sessionId) => {
        if (!auth.currentUser) return setScanMessage('Error: Not logged in.');

        setIsProcessing(true);
        setScanMessage('Getting your location...');

        navigator.geolocation.getCurrentPosition(async (position) => {
            setScanMessage('Location found. Verifying attendance...');
            const { latitude, longitude } = position.coords;

            try {
                const token = await auth.currentUser.getIdToken();
                const response = await fetch(`${BACKEND_URL}/markAttendance`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        sessionId: sessionId,
                        studentLocation: { latitude, longitude }
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Verification failed.');
                
                setScanMessage(`✅ ${data.message}`);
            } catch (error) {
                console.error("Error marking attendance: ", error);
                setScanMessage(`❌ ${error.message}`);
            } finally {
                setIsProcessing(false);
            }
        }, (error) => {
            console.error("Geolocation error:", error);
            setScanMessage('❌ Could not get your location. Please enable location permissions.');
            setIsProcessing(false);
        });
    };

    return (
        <div className="content-section">
            <h2 className="content-title">Welcome, {user.firstName || 'Student'}!</h2>
            <div className="card">
                <h3>Live Attendance</h3>
                {liveSession ? (
                    <>
                        <h4>A session for <strong>{liveSession.subject || 'your class'}</strong> has started.</h4>
                        <p>Teacher: <strong>{liveSession.teacherName || 'Your Teacher'}</strong></p>
                        <button onClick={() => { setShowScanner(true); setScanMessage(''); }} className="btn-primary" disabled={isProcessing}>
                            {isProcessing ? 'Processing...' : 'Scan Attendance Code'}
                        </button>
                    </>
                ) : (<p>No active attendance session right now.</p>)}
                {scanMessage && <p className="scan-message">{scanMessage}</p>}
            </div>
            {showScanner && (
                <div className="card scanner-card">
                    <h3>Scan QR Code</h3>
                    <div id="qr-reader" style={{width: '100%'}}></div>
                    <button onClick={() => setShowScanner(false)} className="btn-secondary">Cancel</button>
                </div>
            )}
        </div>
    );
};

const Goals = () => <div className="content-section"><h2>🎯 My Goals</h2><p>Set and track your academic and personal goals here.</p></div>;
const FuturePlans = () => <div className="content-section"><h2>🚀 Future Plans</h2><p>Outline your career aspirations and future study plans.</p></div>;
const CodingPractice = () => <div className="content-section"><h2>💻 Coding Practice</h2><p>Find daily coding challenges and track your progress.</p></div>;

export default function StudentDashboard() {
  const [activePage, setActivePage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
        if(auth.currentUser){
            const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (userDoc.exists()) setUser(userDoc.data());
        }
    };
    if(auth.currentUser) fetchUserData();
  }, []);

  const handleLogout = async () => { await signOut(auth); navigate('/'); };

  const renderContent = () => {
    if(!user) return <div style={{textAlign: 'center', paddingTop: '50px'}}>Loading...</div>;
    switch (activePage) {
      case 'dashboard': return <DashboardHome user={user} />;
      case 'goals': return <Goals />;
      case 'plans': return <FuturePlans />;
      case 'coding': return <CodingPractice />;
      case 'tasks': return <FreePeriodTasks />; 
      default: return <DashboardHome user={user} />;
    }
  };
  
  const NavLink = ({ page, icon, label }) => (<li className={activePage === page ? 'active' : ''} onClick={() => {setActivePage(page); setIsMobileNavOpen(false);}}><i className={`icon-${icon}`}></i><span>{label}</span></li>);

  return (
    <div className="dashboard-container">
      {isMobileNavOpen && <div className="nav-overlay" onClick={() => setIsMobileNavOpen(false)}></div>}
      <aside className={`sidebar ${isMobileNavOpen ? 'open' : ''}`}>
        <div className="logo-container">
          <img src="https://iili.io/KoAVeZg.md.png" alt="AcadeX Logo" className="sidebar-logo"/>
          <span className="logo-text">AcadeX</span>
        </div>
        
        {user && (
            <div className="teacher-info">
                <h4>{user.firstName} {user.lastName}</h4>
                <p>Roll No: {user.rollNo}</p>
                <p>{user.instituteName}</p>
            </div>
        )}

        <ul className="menu">
            <NavLink page="dashboard" icon="dashboard" label="Dashboard" />
            <NavLink page="goals" icon="goals" label="My Goals" />
            <NavLink page="plans" icon="plans" label="Future Plans" />
            <NavLink page="coding" icon="coding" label="Coding Practice" />
            <NavLink page="tasks" icon="tasks" label="Free Period Tasks" />
        </ul>
        <div className="sidebar-footer">
            <div className="user-profile"><span className="user-email">{auth.currentUser?.email}</span></div>
            <button onClick={handleLogout} className="logout-btn"><i className="icon-logout"></i><span>Logout</span></button>
        </div>
      </aside>
      <main className="main-content">
        <header className="mobile-header"><button className="hamburger-icon" onClick={() => setIsMobileNavOpen(true)}>&#9776;</button><div className="mobile-logo">AcadeX</div></header>
        {renderContent()}
      </main>
    </div>
  );
}