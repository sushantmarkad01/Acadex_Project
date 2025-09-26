import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import './Dashboard.css'; 

import { collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore';

export default function AddTasks() {
    const [task, setTask] = useState({ title: '', description: '', link: '' });
    const [myTasks, setMyTasks] = useState([]);
    const [teacherInfo, setTeacherInfo] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // State to manage the custom confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    // Effect to fetch the logged-in teacher's profile information
    useEffect(() => {
        const fetchTeacherData = async () => {
            if (auth.currentUser) {
                const userDocRef = doc(db, "users", auth.currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setTeacherInfo(userDoc.data());
                }
            }
        };
        fetchTeacherData();
    }, []);

    // Effect to fetch tasks created by the current teacher in real-time
    useEffect(() => {
        if (auth.currentUser) {
            const q = query(collection(db, 'tasks'), where('teacherId', '==', auth.currentUser.uid));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const tasksData = snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() }));
                setMyTasks(tasksData);
            });
            return () => unsubscribe(); // Cleanup the listener
        }
    }, []);

    // Handles the submission of the new task form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!task.title || !task.description) {
            setError('❌ Please provide a title and description for the task.');
            return;
        }
        if (!teacherInfo) {
            setError('❌ Could not verify teacher information. Please try again.');
            return;
        }

        try {
            await addDoc(collection(db, 'tasks'), {
                ...task,
                teacherId: auth.currentUser.uid,
                teacherName: `${teacherInfo.firstName} ${teacherInfo.lastName}`.trim(),
                createdAt: serverTimestamp(),
            });
            setSuccess('✅ Task added successfully!');
            setTask({ title: '', description: '', link: '' }); // Clear the form
            setTimeout(() => setSuccess(''), 3000); // Hide success message after 3 seconds
        } catch (err) {
            setError('❌ Failed to add task. Please try again.');
            console.error(err);
        }
    };

    // Opens the custom confirmation modal instead of the browser pop-up
    const handleDeleteClick = (taskId) => {
        setTaskToDelete(taskId);
        setShowConfirmModal(true);
    };

    // Deletes the task after the user confirms in the modal
    const confirmDelete = async () => {
        if (taskToDelete) {
            try {
                await deleteDoc(doc(db, "tasks", taskToDelete));
            } catch (err) {
                setError("❌ Failed to delete task. Please try again.");
                console.error(err);
            }
        }
        setShowConfirmModal(false);
        setTaskToDelete(null);
    };

    return (
        <div className="content-section">
            {/* The Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to permanently delete this task?</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                            <button className="btn-delete" onClick={confirmDelete}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="content-title">Add a New Free Period Task</h2>
            <p className="content-subtitle">Create tasks that will be available for all students.</p>
            
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Task Title</label>
                        <input type="text" placeholder="e.g., Read Chapter 5" value={task.title} onChange={(e) => setTask({...task, title: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label>Task Description</label>
                        <textarea placeholder="Provide a brief summary of the task." value={task.description} onChange={(e) => setTask({...task, description: e.target.value})} rows="4"></textarea>
                    </div>
                    <div className="input-group">
                        <label>Resource Link (Optional)</label>
                        <input type="url" placeholder="https://example.com/resource" value={task.link} onChange={(e) => setTask({...task, link: e.target.value})} />
                    </div>
                    
                    {/* Styled, in-page messages for errors and success */}
                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}

                    <button type="submit" className="btn-primary">Add Task</button>
                </form>
            </div>

            <h2 className="content-title" style={{marginTop: '40px'}}>Your Created Tasks</h2>
            <div className="cards-grid">
                {myTasks.length > 0 ? (
                    myTasks.map(t => (
                        <div key={t.id} className="card task-card">
                            <h3>{t.title}</h3>
                            <p>{t.description}</p>
                            <div className="task-card-footer">
                                {t.link && <a href={t.link} target="_blank" rel="noopener noreferrer" className="btn-secondary">View Resource</a>}
                                <button onClick={() => handleDeleteClick(t.id)} className="btn-delete">Delete Task</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>You haven't created any tasks yet.</p>
                )}
            </div>
        </div>
    );
}

