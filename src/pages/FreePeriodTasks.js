import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, onSnapshot, doc, setDoc, getDocs } from 'firebase/firestore';
import './Dashboard.css';

export default function FreePeriodTasks() {
    const [tasks, setTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState(new Set()); // Use a Set for fast lookups
    const [loading, setLoading] = useState(true);

    // Fetch all available tasks
    useEffect(() => {
        const q = query(collection(db, 'tasks'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(tasksData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch the student's completed tasks
    useEffect(() => {
        const fetchCompleted = async () => {
            if (auth.currentUser) {
                const completedTasksRef = collection(db, "users", auth.currentUser.uid, "completedTasks");
                const snapshot = await getDocs(completedTasksRef);
                const completedIds = snapshot.docs.map(doc => doc.id);
                setCompletedTasks(new Set(completedIds));
            }
        };
        fetchCompleted();
    }, []);

    // Function to mark a task as complete
    const handleComplete = async (taskId) => {
        try {
            const completedTaskRef = doc(db, "users", auth.currentUser.uid, "completedTasks", taskId);
            await setDoc(completedTaskRef, {
                completedAt: new Date()
            });
            // Add to our local set to update the UI instantly
            setCompletedTasks(prev => new Set(prev).add(taskId));
        } catch (err) {
            console.error("Failed to mark task as complete:", err);
        }
    };

    if (loading) {
        return <div className="content-section"><p>Loading tasks...</p></div>;
    }

    return (
        <div className="content-section">
            <h2 className="content-title">Free Period Tasks</h2>
            <p className="content-subtitle">Make the most of your free time with these suggested tasks.</p>
            
            <div className="cards-grid">
                {tasks.length > 0 ? (
                    tasks.map(task => {
                        const isCompleted = completedTasks.has(task.id);
                        return (
                            <div key={task.id} className={`card task-card ${isCompleted ? 'completed' : ''}`}>
                                <h3>{task.title}</h3>
                                <p className="task-author">Assigned by: {task.teacherName}</p>
                                <p>{task.description}</p>
                                {task.link && <a href={task.link} target="_blank" rel="noopener noreferrer" className="btn-secondary">View Resource</a>}
                                <button 
                                    onClick={() => handleComplete(task.id)} 
                                    className={`btn-primary ${isCompleted ? 'btn-completed' : ''}`}
                                    disabled={isCompleted}
                                    style={{marginTop: '15px'}}
                                >
                                    {isCompleted ? 'Completed ✓' : 'Mark as Complete'}
                                </button>
                            </div>
                        )
                    })
                ) : (
                    <p>No tasks are available right now.</p>
                )}
            </div>
        </div>
    );
}

