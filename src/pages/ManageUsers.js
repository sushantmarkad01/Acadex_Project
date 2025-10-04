import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import './Dashboard.css'; 

export default function ManageUsers({ instituteId }) {
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!instituteId) return;

        const usersQuery = query(collection(db, "users"), where("instituteId", "==", instituteId));
        
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setTeachers(usersData.filter(user => user.role === 'teacher'));
            setStudents(usersData.filter(user => user.role === 'student'));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [instituteId]);


    if (loading) {
        return <div className="content-section"><p>Loading users...</p></div>;
    }

    return (
        <div className="content-section">
            <h2 className="content-title">Manage Users</h2>
            
            <div className="card card-full-width">
                <h3>Teachers ({teachers.length})</h3>
                <div className="table-wrapper">
                    <table className="attendance-table">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Subject</th></tr>
                        </thead>
                        <tbody>
                            {teachers.map(t => (
                                <tr key={t.id}>
                                    <td>{t.firstName} {t.lastName}</td>
                                    <td>{t.email}</td>
                                    <td>{t.subject}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card card-full-width" style={{marginTop: '2rem'}}>
                <h3>Students ({students.length})</h3>
                <div className="table-wrapper">
                    <table className="attendance-table">
                        <thead>
                            <tr><th>Roll No.</th><th>Name</th><th>Email</th></tr>
                        </thead>
                        <tbody>
                            {students.sort((a,b) => (a.rollNo || "").localeCompare(b.rollNo, undefined, {numeric: true})).map(s => (
                                <tr key={s.id}>
                                    <td>{s.rollNo}</td>
                                    <td>{s.firstName} {s.lastName}</td>
                                    <td>{s.email}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}