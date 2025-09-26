import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
// FIX: Corrected import path. Assumes firebase.js is in the parent 'src' directory.
import { auth, db } from '../firebase'; 
// FIX: Corrected import paths. Assumes these files are in the same 'pages' directory.
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import InstituteAdminDashboard from './InstituteAdminDashboard';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            console.error("User document not found for UID:", user.uid);
            setUserRole('error');
          }
        } catch (err) {
            console.error("Error fetching user document:", err);
            setUserRole('error');
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h2>Loading...</h2></div>;
  }

  switch (userRole) {
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'institute-admin':
      return <InstituteAdminDashboard />;
    default:
      return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h1>An Error Occurred</h1>
          <p>We couldn't find your user role. Please sign out and try again.</p>
          <button onClick={() => auth.signOut()}>Sign Out</button>
        </div>
      );
  }
}

