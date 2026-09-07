import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar";
import { useAuth } from "../context/authContext";
import "../css/progress.css";

type RoadmapSkill = {
    skill_id: number;
    skill_name: string;
    category: string;
    skill_level: "Beginner" | "Intermediate" | "Advanced";
    roadmap_stage: number;
    sequence_order: number;
    status: "completed" | "not-started";
};

type Career = {
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

function Progress() {

    const { user } = useAuth();
    const navigate = useNavigate();

    const [career, setCareer] = useState<Career | null>(null);
    const [roadmap, setRoadmap] = useState<RoadmapSkill[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        async function loadProgress() {

            if (!user?.career_goal_id) {
                setLoading(false);
                return;
            }

            try {

                const token = localStorage.getItem("token");

                const headers = {
                    Authorization: `Bearer ${token}`
                };

                // Get career details
                const careerResponse = await axios.get(
                    `http://localhost:5000/api/careers/${user.career_goal_id}`,
                    { headers }
                );

                setCareer(careerResponse.data);

                // Get career roadmap
                const roadmapResponse = await axios.get(
                    `http://localhost:5000/api/careers/${user.career_goal_id}/roadmap`,
                    { headers }
                );

                setRoadmap(roadmapResponse.data);

            } catch (error) {

                console.error(
                    "PROGRESS PAGE ERROR:",
                    error
                );

            } finally {

                setLoading(false);

            }
        }

        loadProgress();

    }, [user?.career_goal_id]);


    // No career selected
    if (!loading && !user?.career_goal_id) {

        return (
            <div className="dashboard-layout">

                <Navbar />

                <main className="dashboard-content">

                    <div className="progress-empty">

                        <div className="progress-empty-icon">
                            ★
                        </div>

                        <h1>No Career Goal Selected</h1>

                        <p>
                            Select a career goal to start tracking
                            your career progress.
                        </p>

                        <button
                            onClick={() => navigate("/careers")}
                        >
                            Explore Careers →
                        </button>

                    </div>

                </main>

            </div>
        );
    }


    if (loading) {

        return (
            <div className="dashboard-layout">

                <Navbar />

                <main className="dashboard-content">

                    <div className="progress-loading">
                        Loading your progress...
                    </div>

                </main>

            </div>
        );
    }


    if (!career) {

        return (
            <div className="dashboard-layout">

                <Navbar />

                <main className="dashboard-content">

                    <div className="progress-empty">

                        <h2>
                            Unable to load progress
                        </h2>

                    </div>

                </main>

            </div>
        );
    }


    const completedSkills = roadmap.filter(
        skill => skill.status === "completed"
    );

    const remainingSkills = roadmap.filter(
        skill => skill.status === "not-started"
    );

    const totalSkills = roadmap.length;

    const completedCount = completedSkills.length;

    const remainingCount = remainingSkills.length;

    const progressPercentage =
        totalSkills > 0
            ? Math.round(
                (completedCount / totalSkills) * 100
            )
            : 0;


    // Group roadmap by stage
    const stages = Array.from(
        new Set(
            roadmap.map(skill => skill.roadmap_stage)
        )
    ).sort((a, b) => a - b);


    return (

        <div className="dashboard-layout">

            <Navbar />

            <main className="dashboard-content">

                {/* PAGE HEADER */}

                <div className="progress-header">

                    <div>

                        <p className="dashboard-label">
                            YOUR PROGRESS
                        </p>

                        <h1>
                            {career.career_name}
                        </h1>

                        <p className="progress-subtitle">
                            Track your journey toward your
                            career goal.
                        </p>

                    </div>

                    <button
                        className="roadmap-button"
                        onClick={() =>
                            navigate(
                                `/careers/${career.career_id}`
                            )
                        }
                    >
                        View Roadmap →
                    </button>

                </div>


                {/* OVERALL PROGRESS */}

                <section className="overall-progress-card">

                    <div className="overall-progress-info">

                        <div>

                            <span className="progress-card-label">
                                OVERALL LEARNING PROGRESS
                            </span>

                            <h2>
                                {progressPercentage}%
                            </h2>

                            <p>
                                {completedCount} of{" "}
                                {totalSkills} skills completed
                            </p>

                        </div>



                    </div>


                    <div className="large-progress-bar">

                        <div
                            className="large-progress-fill"
                            style={{
                                width: `${progressPercentage}%`
                            }}
                        />

                    </div>

                </section>


                {/* STAT CARDS */}




                {/* CURRENT POSITION */}

                <section className="current-position-card">

                    <div className="section-heading">

                        <div>

                            <p className="dashboard-label">
                                YOUR JOURNEY
                            </p>

                            <h2>
                                Where You Are Now
                            </h2>

                        </div>

                    </div>


                    <div className="position-content">

                        <div className="position-item completed-position">

                            <div className="position-number">
                                ✓
                            </div>

                            <div>

                                <h3>
                                    {completedCount} Skills Completed
                                </h3>

                                <p>
                                    These skills are already part
                                    of your skill set.
                                </p>

                            </div>

                        </div>


                        <div className="position-line" />


                        <div className="position-item next-position">

                            <div className="position-number">
                                →
                            </div>

                            <div>

                                <h3>
                                    {career.missing_skills.length} Skills To Learn
                                </h3>

                                <p>
                                    These skills are required
                                    for your selected career.
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ROADMAP PROGRESS */}

                <section className="roadmap-progress-section">

                    <div className="section-heading">

                        <div>

                            <p className="dashboard-label">
                                SKILL ROADMAP
                            </p>

                            <h2>
                                Your Learning Path
                            </h2>

                        </div>

                    </div>


                    <div className="progress-roadmap">

                        {stages.map(stage => {

                            const stageSkills =
                                roadmap.filter(
                                    skill =>
                                        skill.roadmap_stage === stage
                                );

                            const stageCompleted =
                                stageSkills.filter(
                                    skill =>
                                        skill.status === "completed"
                                ).length;

                            const stagePercentage =
                                stageSkills.length > 0
                                    ? Math.round(
                                        (stageCompleted /
                                            stageSkills.length) *
                                        100
                                    )
                                    : 0;

                            return (

                                <div
                                    className="progress-stage"
                                    key={stage}
                                >

                                    <div className="stage-header">

                                        <div>

                                            <span className="stage-number">
                                                Stage {stage}
                                            </span>

                                            <h3>
                                                Learning Stage {stage}
                                            </h3>

                                        </div>

                                        <span className="stage-percentage">
                                            {stagePercentage}%
                                        </span>

                                    </div>


                                    <div className="stage-progress-bar">

                                        <div
                                            className="stage-progress-fill"
                                            style={{
                                                width:
                                                    `${stagePercentage}%`
                                            }}
                                        />

                                    </div>


                                    <div className="stage-skills">

                                        {stageSkills.map(
                                            skill => (

                                                <div
                                                    className={`progress-skill ${skill.status ===
                                                        "completed"
                                                        ? "skill-completed"
                                                        : "skill-remaining"
                                                        }`}
                                                    key={
                                                        skill.skill_id
                                                    }
                                                >

                                                    <div className="skill-check">

                                                        {skill.status ===
                                                            "completed"
                                                            ? "✓"
                                                            : "○"}

                                                    </div>


                                                    <div className="skill-info">

                                                        <h4>
                                                            {
                                                                skill.skill_name
                                                            }
                                                        </h4>

                                                        <span>
                                                            {
                                                                skill.skill_level
                                                            }
                                                        </span>

                                                    </div>


                                                    <div className="skill-status">

                                                        {skill.status ===
                                                            "completed"
                                                            ? "Completed"
                                                            : "Not Started"}

                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>

                                </div>

                            );

                        })}

                    </div>

                </section>


                {/* NEXT STEPS */}

                {remainingSkills.length > 0 && (

                    <section className="next-step-card">

                        <div>

                            <span className="dashboard-label">
                                RECOMMENDED NEXT STEP
                            </span>

                            <h2>
                                Start with{" "}
                                {remainingSkills[0].skill_name}
                            </h2>

                            <p>
                                This skill is part of your
                                career roadmap. Learning it will
                                help you move closer to your
                                career goal.
                            </p>

                        </div>


                        <button
                            onClick={() =>
                                navigate(
                                    `/careers/${career.career_id}`
                                )
                            }
                        >
                            View Skill Roadmap →
                        </button>

                    </section>

                )}

            </main>

        </div>
    );
}

export default Progress;