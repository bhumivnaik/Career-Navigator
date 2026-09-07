import React from 'react'
import Navbar from './ui/Navbar'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Career } from './Dashboard';
import { useEffect, useState } from 'react';
import CareerCard from './ui/careerCard';
import { useAuth } from '../context/authContext';

const Career = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [careers, setCareers] = useState<Career[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCareer() {
            try {
                const token = localStorage.getItem("token");
                const headers = {
                    Authorization: `Bearer ${token}`
                };

                // Get recommended careers
                try {
                    const careersResponse = await axios.get(
                        "http://localhost:5000/api/careers/recommended",
                        { headers }
                    );

                    console.log("RECOMMENDED CAREERS:", careersResponse.data);
                    setCareers(careersResponse.data);

                } catch (error) {
                    console.error("CAREERS API ERROR:", error);
                    throw error;
                }

            } catch (error) {
                console.error("CAREEER DASHBOARD ERROR:", error);
                alert("Failed to load career dashboard");

            } finally {
                setLoading(false);
            }
        }

        loadCareer();

    }, []);

    function handleLogout() {
        logout();
        navigate("/login");
    }

    if (loading) {
        return (
            <div className="dashboard-loading">Loading dashboard...</div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Navbar />

            <main className="dashboard-content">
                <div>
                    <div className="careers-page-header">
                        <div>
                            <p className="dashboard-label">
                                CAREER DISCOVERY
                            </p>
                            <h1>Explore Careers</h1>
                            <p className="careers-subtitle">
                                Explore career paths and see how well your
                                current skills match each one.
                            </p>

                        </div>

                        <div className="career-count">
                            <strong>{careers.length}</strong>
                            <span>Career Paths</span>
                        </div>

                    </div>
                </div>
                <div style={{
                    backgroundColor: "var(--primary)",
                    borderRadius: "20px",
                    padding: "15px"

                }}>
                    <div style={{ color: "var(--primary-light)", padding: "15px", borderRadius: "10px" }}>Recommended Pathways</div>

                    <div className="career-grid">
                        {
                            careers.map((career) => (
                                career.match_percentage > 10 &&
                                < CareerCard key={career.career_id} career={career} />
                            ))}
                    </div>
                </div>
                <br /><br />
                <hr />
                <div style={{
                    backgroundColor: "var(--primary)",
                    borderRadius: "20px",
                    padding: "15px",
                    marginTop: "50px"

                }}>
                    <div style={{ color: "var(--primary-light)", padding: "15px", borderRadius: "10px" }}>Least Recommended Pathways</div>

                    <div className="career-grid">
                        {
                            careers.map((career) => (
                                career.match_percentage < 10 &&
                                < CareerCard key={career.career_id} career={career} />
                            ))}
                    </div>
                </div>

            </main>
        </div>
    )
}

export default Career
