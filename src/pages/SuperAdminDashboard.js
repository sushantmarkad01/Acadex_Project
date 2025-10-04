import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db, sendPasswordResetEmail } from '../firebase'; // ✅ Import sendPasswordResetEmail
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import './SuperAdminDashboard.css';

export default function SuperAdminDashboard() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "applications"), (snapshot) => {
            const appData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setApplications(appData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleApproval = async (app) => {
        setError('');
        const newAdminUid = prompt(
            `STEP 1: Please go to Firebase Authentication and create a user for ${app.email}.\n\nSTEP 2: Paste their new User UID here to finalize approval.`
        );

        if (!newAdminUid || newAdminUid.trim() === '') {
            alert("Approval cancelled. No UID was provided.");
            return;
        }

        try {
            const userDocRef = doc(db, "users", newAdminUid.trim());
            await setDoc(userDocRef, {
                uid: newAdminUid.trim(),
                email: app.email,
                role: 'institute-admin',
                instituteId: app.id,
                instituteName: app.instituteName,
                firstName: app.contactName,
            });

            const appRef = doc(db, "applications", app.id);
            await updateDoc(appRef, { status: 'approved', adminUid: newAdminUid.trim() });
            alert(`Success! Institute admin profile created for ${app.instituteName}. You can now send them a login link.`);
        } catch (error) {
            console.error("Error approving application: ", error);
            setError(`Failed to approve application. Error: ${error.message}`);
        }
    };

    const handleDenial = async (app) => {
        if (window.confirm(`Are you sure you want to deny the application for ${app.instituteName}?`)) {
            const appRef = doc(db, "applications", app.id);
            await updateDoc(appRef, { status: 'denied' });
        }
    };

    // ✅ New function to send the password reset email
    const handleSendLoginLink = async (email) => {
        if (!window.confirm(`Are you sure you want to send a password setup email to ${email}?`)) {
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            alert(`Password setup email sent successfully to ${email}.`);
        } catch (error) {
            console.error("Error sending password reset email:", error);
            alert(`Failed to send email. Error: ${error.message}`);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    if (loading) {
        return <div>Loading applications...</div>;
    }

    return (
        <div className="super-admin-container">
            <header className="super-admin-header">
                <h1>Super Admin Panel</h1>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
            </header>
            <main>
                <h2>Institute Applications</h2>
                {error && <p className="error-message">{error}</p>}
                <div className="application-list-wrapper">
                    <div className="application-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>Institute Name</th>
                                    <th>Contact Person</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map(app => (
                                    <tr key={app.id}>
                                        <td data-label="Institute Name">{app.instituteName}</td>
                                        <td data-label="Contact Person">{app.contactName}</td>
                                        <td data-label="Email">{app.email}</td>
                                        <td data-label="Status"><span className={`status-badge status-${app.status}`}>{app.status}</span></td>
                                        <td data-label="Actions">
                                            <div className="action-buttons">
                                                {app.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleApproval(app)} className="btn-approve">Approve</button>
                                                        <button onClick={() => handleDenial(app)} className="btn-deny">Deny</button>
                                                    </>
                                                )}
                                                {/* ✅ Show new button if approved */}
                                                {app.status === 'approved' && (
                                                    <button onClick={() => handleSendLoginLink(app.email)} className="btn-send-link">Send Login Link</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}