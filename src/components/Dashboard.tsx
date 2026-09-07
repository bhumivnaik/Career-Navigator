import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "../css/dashboard.css";
import Navbar from "../components/ui/Navbar";
import CareerCard from "./ui/careerCard";

type Skill = {
    skill_id: number;
    skill_name: string;
    category: string;
};

export type Career = {
    career_id: number;
    career_name: string;
    description: string;
    category: string;
    match_percentage: number;
    matched_count: number;
    total_skills: number;
    matched_skills: string[];
    missing_skills: string[];
};

function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [skills, setSkills] = useState<Skill[]>([]);
    const [careers, setCareers] = useState<Career[]>([]);
    const [loading, setLoading] = useState(true);
    const [goalMatch, setGoalMatch] = useState(0);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const token = localStorage.getItem("token");

                const headers = {
                    Authorization: `Bearer ${token}`
                };

                // Get user's skills
                try {
                    const skillsResponse = await axios.get(
                        "http://localhost:5000/api/skills/user",
                        { headers }
                    );

                    console.log("USER SKILLS:", skillsResponse.data);
                    setSkills(skillsResponse.data);

                } catch (error) {
                    console.error("USER SKILLS API ERROR:", error);
                    throw error;
                }


                // Get recommended careers
                try {
                    const careersResponse = await axios.get(
                        "http://localhost:5000/api/careers/recommended",
                        { headers }
                    );

                    console.log("RECOMMENDED CAREERS:", careersResponse.data);
                    setCareers(careersResponse.data);
                    const goalCareer = careersResponse.data.find(
                        (career: Career) =>
                            career.career_id === user?.career_goal_id
                    );

                    setGoalMatch(goalCareer?.match_percentage);
                } catch (error) {
                    console.error("CAREERS API ERROR:", error);
                    throw error;
                }

            } catch (error) {
                console.error("DASHBOARD ERROR:", error);
                alert("Failed to load dashboard");

            } finally {
                setLoading(false);
            }
        }

        loadDashboard();

    }, [user]);

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
                <header className="dashboard-topbar">
                    <div>
                        <p className="dashboard-label">
                            DASHBOARD
                        </p>
                        <h1>
                            Welcome back,{" "}
                            {user?.full_name}
                        </h1>
                    </div>

                    <div className="user-profile">
                        <div className="user-avatar">
                            {user?.full_name
                                ?.charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>{user?.full_name}</strong>
                            <span>{user?.email}</span>
                        </div>
                    </div>
                </header>

                <section className="welcome-card">
                    <div>
                        <span className="welcome-badge">YOUR CAREER JOURNEY </span>
                        <h2>Discover where your skills can take you.</h2>
                        <p>Explore career paths that match your current skills and find out what you need to learn next.</p>
                        <button onClick={() => navigate("/careers")}>Explore Careers →</button>
                    </div>
                    <div className="div2">
                        <span className="welcome-badge" style={{ color: "var(--primary-dark)", fontSize: "14px" }}>YOUR CURRENT GOAL</span>
                        {user?.career_goal_id && (
                            <>
                                <h3>{user.career_goal_name}</h3>
                                <div className="goal-match">
                                    <strong>
                                        {goalMatch}%
                                    </strong>
                                    <span>career match</span>
                                </div>

                                <div className="goal-progress">
                                    <div
                                        className="goal-progress-fill"
                                        style={{
                                            width: `${goalMatch}%`
                                        }}
                                    />
                                </div>

                                <button
                                    className="goal-button"
                                    onClick={() => navigate("/progress")}
                                >
                                    View Progress →
                                </button>
                            </>

                        )}

                    </div>
                </section>

                <section className="summary-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            ✦
                        </div>
                        <div>
                            <span>
                                Your Skills
                            </span>

                            <strong>
                                {skills.length}
                            </strong>

                            <p>
                                Skills in your profile
                            </p>

                        </div>

                    </div>


                    <div className="stat-card">
                        <div className="stat-icon">
                            ◆
                        </div>
                        <div>
                            <span>
                                Career Matches
                            </span>
                            <strong>
                                {careers.filter(career => career.match_percentage >= 10).length}                            </strong>

                            <p>
                                Careers matched
                            </p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            %
                        </div>
                        <div>
                            <span>
                                Learning Progress
                            </span>
                            <strong>
                                0%
                            </strong>

                            <p>
                                Overall progress
                            </p>

                        </div>

                    </div>


                </section>



                {/* ================= SKILLS ================= */}

                <section className="dashboard-section">

                    <div className="section-heading">

                        <div>

                            <h2>
                                Your Skills
                            </h2>

                            <p>
                                Technologies and skills
                                currently in your profile
                            </p>

                        </div>


                        <button
                            className="section-action"
                            onClick={() =>
                                navigate(
                                    "/skills-setup"
                                )
                            }
                        >
                            Edit Skills
                        </button>

                    </div>


                    <div className="skill-list">

                        {skills.length === 0 ? (

                            <p className="empty-text">
                                No skills added yet.
                            </p>

                        ) : (

                            skills.map((skill) => (

                                <span
                                    className="skill-pill"
                                    key={
                                        skill.skill_id
                                    }
                                >
                                    {skill.skill_name}
                                </span>

                            ))

                        )}

                    </div>

                </section>



                {/* ================= CAREERS ================= */}

                <section className="dashboard-section">
                    <div className="section-heading">
                        <div>
                            <h2>Recommended Careers</h2>
                            <p>Career paths based on your current skills</p>
                        </div>
                        <button className="section-action" onClick={() => navigate("/careers")}>
                            View All
                        </button>
                    </div>

                    {careers.length === 0 ? (
                        <div className="career-placeholder">
                            <div className="placeholder-icon">◆</div>
                            <h3>Your career matches are coming soon</h3>
                            <p>We'll compare your skills with available career paths and show your strongest matches here.</p>
                        </div>
                    ) : (
                        <div className="career-grid">
                            {careers.slice(0, 3).map((career) => (
                                <CareerCard key={career.career_id} career={career} />
                            ))}
                        </div>
                    )}
                </section>



                {/* ================= BUILD PROFILE ================= */}

                <section className="dashboard-section">

                    <div className="section-heading">

                        <div>

                            <h2>
                                Strengthen Your Profile
                            </h2>

                            <p>
                                Add more information to get
                                deeper career insights.
                            </p>

                        </div>

                    </div>


                    <div className="quick-actions">

                        <button>
                            <span>+</span>
                            Education
                        </button>

                        <button>
                            <span>+</span>
                            Projects
                        </button>

                        <button>
                            <span>+</span>
                            Experience
                        </button>

                        <button>
                            <span>+</span>
                            Courses
                        </button>

                    </div>

                </section>


            </main>
        </div>

    );

}

export default Dashboard;