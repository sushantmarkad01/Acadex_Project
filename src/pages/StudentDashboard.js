import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
// Please verify this path matches your project structure
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';
// Please verify this path matches your project structure
import './Dashboard.css';

// We assume FreePeriodTasks is in its own file. The others can be placeholders for now.
import FreePeriodTasks from './FreePeriodTasks'; 

// --- Child Components for the Dashboard ---

const DashboardHome = ({ user }) => {
    const [liveSession, setLiveSession] = useState(null);
    const [scanMessage, setScanMessage] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "live_sessions"), where("isActive", "==", true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setLiveSession({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            } else {
                setLiveSession(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let scanner;
        if (showScanner) {
            scanner = new Html5QrcodeScanner("qr-reader", { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
            const onScanSuccess = (decodedText) => {
                setShowScanner(false);
                handleScan(decodedText);
            };
            const onScanError = () => {};
            scanner.render(onScanSuccess, onScanError);
        }
        return () => {
            // Ensure scanner is cleared properly only if it's running
            if (scanner && scanner.getState() !== 2) { // 2 is Html5QrcodeScannerState.NOT_STARTED
                scanner.clear().catch(err => console.error("Scanner clear failed.", err));
            }
        };
    }, [showScanner]);
    
    const handleScan = async (sessionId) => {
        if (!auth.currentUser) return setScanMessage('Error: Not logged in.');
        setScanMessage('Processing...');
        try {
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const attendanceRef = doc(db, `attendance/${sessionId}_${auth.currentUser.uid}`);
                await setDoc(attendanceRef, {
                    sessionId,
                    studentId: auth.currentUser.uid,
                    studentEmail: auth.currentUser.email,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    rollNo: userData.rollNo || '',
                    timestamp: serverTimestamp(),
                    status: 'Present'
                });
                setScanMessage('✅ Attendance Marked Successfully!');
            } else {
                setScanMessage('❌ Your profile was not found.');
            }
        } catch (error) {
            console.error("Error marking attendance: ", error);
            setScanMessage('❌ Could not mark attendance.');
        }
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
                        <button onClick={() => { setShowScanner(true); setScanMessage(''); }} className="btn-primary">
                            Scan Attendance Code
                        </button>
                    </>
                ) : (
                    <p>No active attendance session right now.</p>
                )}
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

// --- Main StudentDashboard Component ---
export default function StudentDashboard() {
  const [activePage, setActivePage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
        if(auth.currentUser){
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) setUser(userDoc.data());
        }
    };
    if(auth.currentUser) fetchUserData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

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
  
  const NavLink = ({ page, icon, label }) => (
      <li className={activePage === page ? 'active' : ''} onClick={() => {setActivePage(page); setIsMobileNavOpen(false);}}>
          <i className={`icon-${icon}`}></i>
          <span>{label}</span>
      </li>
  );

  return (
    <div className="dashboard-container">
      {isMobileNavOpen && <div className="nav-overlay" onClick={() => setIsMobileNavOpen(false)}></div>}
      <aside className={`sidebar ${isMobileNavOpen ? 'open' : ''}`}>
        <div className="logo-container">
          {/* LOGO UPDATED HERE */}
          <img src="https://iili.io/KoAVeZg.md.png" alt="AcadeX Logo" className="sidebar-logo"/>
          <span className="logo-text">AcadeX</span>
        </div>
        <ul className="menu">
            <NavLink page="dashboard" icon="dashboard" label="Dashboard" />
            <NavLink page="goals" icon="goals" label="My Goals" />
            <NavLink page="plans" icon="plans" label="Future Plans" />
            <NavLink page="coding" icon="coding" label="Coding Practice" />
            <NavLink page="tasks" icon="tasks" label="Free Period Tasks" />
        </ul>
        <div className="sidebar-footer">
            <div className="user-profile">
                <span className="user-name">{user ? `${user.firstName} ${user.lastName}` : '...'}</span>
                <span className="user-email">{auth.currentUser?.email}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
                <i className="icon-logout"></i>
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

