import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar";
import { useEffect, useState } from "react";
import axios from "axios";
import type { Career } from "./Dashboard";
import CareerRoadmap from "../components/ui/CareerRoadmap"
import { useAuth } from "../context/authContext";


function CareerDetails() {
    const { careerId } = useParams();
    const navigate = useNavigate();
    const [career, setCareer] = useState<Career | null>(null);
    const [animatedPercentage, setAnimatedPercentage] = useState(0);


    const { user, login } = useAuth();
    const [showGoalPopup, setShowGoalPopup] = useState(false);
    const [settingGoal, setSettingGoal] = useState(false);


    useEffect(() => {
        async function loadDetails() {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                const details = await axios.get(`http://localhost:5000/api/careers/${careerId}`, { headers });
                console.log("CAREER DETAILS:", details.data);
                setCareer(details.data);
            } catch (error) {
                console.error("USER SKILLS API ERROR:", error);
                throw error;
            }
        }
        loadDetails();
    },
        [careerId]);

    useEffect(() => {

        if (!career) return;

        setAnimatedPercentage(0);

        const duration = 1000;
        const startTime = performance.now();

        function animate(currentTime: number) {

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentPercentage = Math.round(
                progress * career?.match_percentage
            );

            setAnimatedPercentage(currentPercentage);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);

    }, [career]);

    async function changeCareerGoal() {
        if (!career) return;
        try {
            setSettingGoal(true);
            const token = localStorage.getItem("token");

            await axios.put(
                "http://localhost:5000/api/careers/goal",
                { career_id: career.career_id },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (user) {
                login({
                    ...user,
                    career_goal_id: career.career_id,
                    career_goal_name: career.career_name
                });
            }
            setShowGoalPopup(false);
        } catch (error) {
            console.error("SET CAREER GOAL ERROR:", error);
            alert("Failed to update career goal");
        } finally {
            setSettingGoal(false);
        }
    }

    function handleCareerGoalClick() {
        if (!career) return;
        if (!user?.career_goal_id) {
            changeCareerGoal();
            return;
        }
        if (user.career_goal_id === career.career_id) {
            return;
        }
        setShowGoalPopup(true);
    }

    return (
        <div className="dashboard-layout">
            <Navbar />

            <main className="dashboard-content">
                <button className="career-back-button" onClick={() => navigate("/careers")}>
                    ←
                </button>
                <div>
                    <div className="career-details-header">
                        <div>
                            <p className="career-category2">{career?.category.toUpperCase()}</p>
                            <h1 className="career-title2">{career?.career_name}</h1>
                            <p className="career-details-desc">{career?.description}</p>
                            <br /><br />
                            <h5>Skills for this Career</h5>
                            {career?.missing_skills.map(
                                (skill) => (
                                    <span className="skilltag" key={skill}>{skill}</span>
                                )
                            )}
                            {career?.matched_skills.map(
                                (skill) => (
                                    <span className="skilltag" key={skill}>{skill}</span>
                                )
                            )}
                        </div>

                        <div className="career-match-box">
                            <span>Your Match</span>
                            <div className="match-circle"
                                style={{
                                    background: `conic-gradient( var(--success2) ${animatedPercentage}%, var(--primary-light2) ${animatedPercentage}% 100%)`
                                }}>
                                <div className="match-circle-inner">
                                    <strong>{animatedPercentage}%</strong>
                                </div>
                            </div>
                            <button className={user?.career_goal_id === career?.career_id
                                ? "goal current" : "goal"} onClick={handleCareerGoalClick}
                                disabled={settingGoal}>
                                {user?.career_goal_id === career?.career_id
                                    ? "✓ Current Career Goal"
                                    : "Set as Goal"
                                }
                            </button>

                        </div>
                    </div>
                </div>

                <section className="career-skills-section">
                    <div className="section-heading2">
                        <div>
                            <h2> Skills for this Career </h2>
                            <p>  See how your current skills match this career </p>
                        </div>
                    </div>

                    <div className="skills-status-grid">
                        <div className="skill-status-card matched">
                            <div className="skill-status-heading">
                                <span className="skill-status-icon"> ✓ </span>
                                <div>
                                    <h3> Matched Skills </h3>
                                    <p> Skills you already have </p>
                                </div>
                            </div>

                            <div className="skill-list">
                                {career?.matched_skills.length > 0 ? (
                                    career?.matched_skills.map(
                                        (skill) => (
                                            <span
                                                className="skill-tag"
                                                key={skill}
                                            >
                                                ✓ {skill}
                                            </span>
                                        )
                                    )

                                ) : (

                                    <p className="no-skills">
                                        No matched skills yet
                                    </p>

                                )}

                            </div>

                        </div>

                        <div className="skill-status-card missing">

                            <div className="skill-status-heading">

                                <span className="skill-status-icon">
                                    !
                                </span>

                                <div>

                                    <h3>
                                        Missing Skills
                                    </h3>

                                    <p>
                                        Skills you need to develop
                                    </p>

                                </div>

                            </div>


                            <div className="skill-list">

                                {career?.missing_skills.length > 0 ? (

                                    career?.missing_skills.map(
                                        (skill) => (
                                            <span
                                                className="skill-tag"
                                                key={skill}
                                            >
                                                ○ {skill}
                                            </span>
                                        )
                                    )

                                ) : (

                                    <p className="no-skills">
                                        You have all required skills!
                                    </p>

                                )}

                            </div>

                        </div>

                    </div>

                </section>

                <section className="career-roadmap-section">
                    <div className="section-heading2">
                        <div>
                            <h2> Career Roadmap </h2>
                            <p> Follow a structured path to reach this career </p>
                        </div>
                    </div>
                    <div className="roadmap-placeholder">
                        {career && (<CareerRoadmap careerId={career.career_id} />)}
                    </div>
                </section>
                {showGoalPopup && (
                    <div className="goal-popup-overlay">
                        <div className="goal-popup">
                            <div className="goal-popup-icon">
                                !
                            </div>

                            <h2>Change Career Goal?</h2>
                            <p> Your current career goal is <strong>{" "}{user?.career_goal_name}</strong></p>

                            <p>
                                Are you sure you want to switch your career goal to
                                <strong>{" "}{career?.career_name}</strong>.
                            </p>

                            <div className="goal-popup-actions">
                                <button
                                    className="goal-cancel-button"
                                    onClick={() => setShowGoalPopup(false)}
                                    disabled={settingGoal}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="goal-confirm-button"
                                    onClick={changeCareerGoal}
                                    disabled={settingGoal}
                                >
                                    {settingGoal
                                        ? "Switching..."
                                        : "Switch Career"
                                    }
                                </button>

                            </div>

                        </div>

                    </div>
                )}
            </main>
        </div>
    );
}

export default CareerDetails;