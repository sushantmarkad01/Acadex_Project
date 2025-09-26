import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { collection, doc, setDoc, serverTimestamp, onSnapshot, query, where, getDocs, writeBatch, getDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { CSVLink } from 'react-csv';
import './Dashboard.css'; 
import AddTasks from './AddTasks';

const DashboardHome = ({ teacherInfo }) => {
    const [activeSession, setActiveSession] = useState(null);
    const [attendanceList, setAttendanceList] = useState([]);
    
    useEffect(() => {
        if (auth.currentUser) {
            const q = query(collection(db, 'live_sessions'), where('teacherId', '==', auth.currentUser.uid), where('isActive', '==', true));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    setActiveSession({ sessionId: snapshot.docs[0].id, ...snapshot.docs[0].data() });
                } else {
                    setActiveSession(null);
                }
            });
            return () => unsubscribe();
        }
    }, []);

    // Effect to fetch and sort the attendance list for the active session
    useEffect(() => {
        if (activeSession) {
            const q = query(collection(db, 'attendance'), where('sessionId', '==', activeSession.sessionId));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort students by roll number in ascending order
                const sortedStudents = students.sort((a, b) => (parseInt(a.rollNo, 10) || 0) - (parseInt(b.rollNo, 10) || 0));
                setAttendanceList(sortedStudents);
            });
            return () => unsubscribe();
        } else {
            setAttendanceList([]);
        }
    }, [activeSession]);

    // Function to start or end an attendance session
    const handleSession = async () => {
        if (activeSession) {
          const sessionRef = doc(db, 'live_sessions', activeSession.sessionId);
          await setDoc(sessionRef, { isActive: false }, { merge: true });
        } else {
          // Deactivate any other sessions before starting a new one
          const q = query(collection(db, "live_sessions"), where("isActive", "==", true));
          const existingSessions = await getDocs(q);
          const batch = writeBatch(db);
          existingSessions.forEach(doc => batch.update(doc.ref, { isActive: false }));
          await batch.commit();

          const newSessionRef = doc(collection(db, 'live_sessions'));
          await setDoc(newSessionRef, {
            sessionId: newSessionRef.id,
            teacherId: auth.currentUser.uid,
            teacherName: `${teacherInfo?.firstName || 'Teacher'} ${teacherInfo?.lastName || ''}`.trim(),
            subject: teacherInfo?.subject || 'Class',
            createdAt: serverTimestamp(),
            isActive: true,
          });
        }
    };
    
    return (
        <div className="content-section">
            <h2 className="content-title">Welcome, {teacherInfo ? teacherInfo.firstName : 'Teacher'}!</h2>
            <p className="content-subtitle">Manage your attendance sessions and student tasks.</p>
            <div className="cards-grid">
                <div className="card">
                    <h3>Attendance Session</h3>
                    <button onClick={handleSession} className="btn-primary" disabled={!teacherInfo}>
                        {activeSession ? 'End Session' : 'Start New Session'}
                    </button>
                    {activeSession && (
                        <div className="qr-container">
                            <p>Session is live. Students can now scan this code.</p>
                            <div className="qr-code-wrapper">
                                <QRCodeSVG value={activeSession.sessionId} size={180} />
                            </div>
                        </div>
                    )}
                </div>
                {activeSession && (
                     <div className="card card-full-width">
                        <h3>Attendance List ({attendanceList.length})</h3>
                        {attendanceList.length > 0 ? (
                            <div className="table-wrapper">
                                <table className="attendance-table">
                                    <thead>
                                        <tr>
                                            <th>Roll No.</th>
                                            <th>First Name</th>
                                            <th>Last Name</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceList.map(student => (
                                            <tr key={student.id}>
                                                <td>{student.rollNo}</td>
                                                <td>{student.firstName}</td>
                                                <td>{student.lastName}</td>
                                                <td>{student.studentEmail}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>No students have checked in yet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Main TeacherDashboard Component
export default function TeacherDashboard() {
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [attendanceList, setAttendanceList] = useState([]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the logged-in teacher's profile data
    const fetchTeacherData = async () => {
        if (auth.currentUser) {
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                setTeacherInfo(userDoc.data());
            }
        }
    };
    if(auth.currentUser) fetchTeacherData();

    // Set up a listener for all attendance records for the download link
    const q = query(collection(db, 'attendance')); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const allStudents = snapshot.docs.map(doc => doc.data());
         const sortedStudents = allStudents.sort((a, b) => (parseInt(a.rollNo, 10) || 0) - (parseInt(b.rollNo, 10) || 0));
        setAttendanceList(sortedStudents);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // Renders the main content based on the active page
  const renderContent = () => {
    if(!teacherInfo) return <div style={{textAlign: 'center', paddingTop: '50px'}}>Loading Teacher Profile...</div>;
    
    switch (activePage) {
      case 'dashboard': return <DashboardHome teacherInfo={teacherInfo} />;
      case 'addTasks': return <AddTasks />;
      default: return <DashboardHome teacherInfo={teacherInfo} />;
    }
  };

  const csvHeaders = [
    { label: "Roll No.", key: "rollNo" },
    { label: "First Name", key: "firstName" },
    { label: "Last Name", key: "lastName" },
    { label: "Email", key: "studentEmail" }
  ];
  
  return (
    <div className="dashboard-container">
      {isMobileNavOpen && <div className="nav-overlay" onClick={() => setIsMobileNavOpen(false)}></div>}
      <aside className={`sidebar ${isMobileNavOpen ? 'open' : ''}`}>
        <div className="logo-container">
          <img src="https://iili.io/KoAVeZg.md.png" alt="AcadeX Logo" className="sidebar-logo"/>
          <span className="logo-text"></span>
        </div>
        
        {teacherInfo && (
            <div className="teacher-info">
                <h4>{teacherInfo.firstName} {teacherInfo.lastName}</h4>
                <p>{teacherInfo.subject}</p>
                <p>{teacherInfo.qualification}</p>
            </div>
        )}
        
        <ul className="menu">
             <li className={activePage === 'dashboard' ? 'active' : ''} onClick={() => { setActivePage('dashboard'); setIsMobileNavOpen(false); }}>
                <i className="icon-dashboard"></i>
                <span>Dashboard</span>
            </li>
             <li className={activePage === 'addTasks' ? 'active' : ''} onClick={() => { setActivePage('addTasks'); setIsMobileNavOpen(false); }}>
                <i className="icon-tasks"></i>
                <span>Add Tasks</span>
            </li>
            <li onClick={() => setIsMobileNavOpen(false)}>
                <CSVLink data={attendanceList} headers={csvHeaders} filename={`attendance-${new Date().toLocaleDateString()}.csv`} className="csv-link">
                    <i className="icon-download"></i>
                    <span>Download Sheet</span>
                </CSVLink>
            </li>
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
            <button className="hamburger-icon" onClick={() => setIsMobileNavOpen(true)}>&#9776;</button>
            <div className="mobile-logo">AcadeX</div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
}

