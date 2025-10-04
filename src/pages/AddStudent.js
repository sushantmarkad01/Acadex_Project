import React, { useState } from 'react';
import { auth, sendPasswordResetEmail } from '../firebase';
import './Dashboard.css';

// Replace with your live backend URL from Render
const BACKEND_URL = "https://acadex-backend-n2wh.onrender.com";

export default function AddStudent({ instituteId }) {
    const [form, setForm] = useState({
        firstName: "", lastName: "", rollNo: "", email: "", password: ""
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);

        try {
            // Step 1: Call your backend to create the user
            const response = await fetch(`${BACKEND_URL}/createUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    role: 'student',
                    instituteId: instituteId,
                    extras: { rollNo: form.rollNo }
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong during user creation.');
            }

            // Step 2: If creation was successful, send the password setup email
            await sendPasswordResetEmail(auth, form.email);
            
            setSuccess(`Student account for ${form.email} created! A password setup email has been sent to them.`);
            setForm({ firstName: "", lastName: "", rollNo: "", email: "", password: "" });

        } catch (err) {
            setError(`Failed to add student. Error: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content-section">
            <h2 className="content-title">Add New Student</h2>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className='instructions'>
                        <p>This will create a student account and automatically send an email to them to set their own password.</p>
                    </div>
                    <div className="input-group"><label>Email Address</label><input type="email" placeholder="student@example.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required /></div>
                    <div className="input-group"><label>Temporary Password</label><input type="password" placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required /></div>
                    <div className="input-group"><label>First Name</label><input type="text" placeholder="Sushant" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} required /></div>
                    <div className="input-group"><label>Last Name</label><input type="text" placeholder="Markad" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} /></div>
                    <div className="input-group"><label>Roll No.</label><input type="text" placeholder="e.g., 21" value={form.rollNo} onChange={(e) => setForm({...form, rollNo: e.target.value})} required /></div>
                    
                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Create Student & Send Invite'}
                    </button>
                </form>
            </div>
        </div>
    );
}