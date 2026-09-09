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
    status: "completed" | "started" | "not-started";
    progress_percentage?: number;
};
type SkillProgress = {
    skill_id: number;
    skill_name: string;
    category: string;
    progress_percentage: number;
    skill_level: "Beginner" | "Developing" | "Proficient";
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
    const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
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
                const skillProgressResponse = await axios.get(
    "http://localhost:5000/api/skills/progress",
    { headers }
);

setSkillProgress(skillProgressResponse.data);

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
    const getEffectiveRoadmap = () => {

    return roadmap.map(skill => {

        // Skills already matched with the career
        // are considered 100% completed
        const isMatched = career.matched_skills.includes(
            skill.skill_name
        );

        if (isMatched) {

            return {
                ...skill,
                progress_percentage: 100,
                status: "completed" as const
            };

        }

        // Get tracked progress for missing skill
        const trackedSkill = skillProgress.find(
            progress =>
                progress.skill_id === skill.skill_id
        );

        const percentage = trackedSkill
            ? Number(trackedSkill.progress_percentage)
            : 0;

        let status: "completed" | "started" | "not-started";

        if (percentage >= 100) {

            status = "completed";

        } else if (percentage > 0) {

            status = "started";

        } else {

            status = "not-started";

        }

        return {
            ...skill,
            progress_percentage: percentage,
            status
        };
    });
};

const effectiveRoadmap = getEffectiveRoadmap();


   const completedSkills = effectiveRoadmap.filter(
    skill => skill.status === "completed"
);

const remainingSkills = effectiveRoadmap.filter(
    skill => skill.status !== "completed"
);

const totalSkills = effectiveRoadmap.length;

const completedCount = completedSkills.length;

const remainingCount = remainingSkills.length;


// Overall learning progress
// Every matched skill = 100%
// Missing skills = their actual tracked percentage
const progressPercentage =
    totalSkills > 0
        ? Math.round(
            effectiveRoadmap.reduce(
                (total, skill) =>
                    total + (skill.progress_percentage ?? 0),
                0
            ) / totalSkills
        )
        : 0;

           const skillProgressPercentage =
    career.total_skills > 0
        ? Math.round(
            (
                (Number(career.matched_count) * 100) +
                skillProgress.reduce(
                    (total, skill) =>
                        total + Number(skill.progress_percentage),
                    0
                )
            ) / Number(career.total_skills)
        )
        : 0;


    // Group roadmap by stage
    const stages = Array.from(
    new Set(
        effectiveRoadmap.map(
            skill => skill.roadmap_stage
        )
    )
).sort((a, b) => a - b);

    const handleUpdateSkillProgress = async (
    skillId: number,
    percentage: number
) => {
    try {
        const token = localStorage.getItem("token");

        await axios.put(
            "http://localhost:5000/api/skills/progress",
            {
                skill_id: skillId,
                progress_percentage: percentage
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

       if (percentage === 100) {

    window.location.reload();

} else {

    setSkillProgress(prev =>
        prev.map(skill =>
            skill.skill_id === skillId
                ? {
                    ...skill,
                    progress_percentage: percentage,
                    skill_level:
                        percentage >= 70
                            ? "Proficient"
                            : percentage >= 40
                                ? "Developing"
                                : "Beginner"
                }
                : skill
        )
    );

}

    } catch (error) {
        console.error(
            "UPDATE SKILL PROGRESS ERROR:",
            error
        );

        alert("Failed to update skill progress");
    }
};

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

                {/* SKILL PROGRESS TRACKER */}

<section className="skill-progress-tracker">

    <div className="section-heading">

        <div>

            <p className="dashboard-label">
                SKILL PROGRESS TRACKER
            </p>

            <h2>
                Track Your Skills
            </h2>

            <p className="progress-section-description">
                Track the skills you need to develop for your selected career.
            </p>

        </div>

    </div>


    <div className="career-readiness-card">

        <div>

            <span className="progress-card-label">
                OVERALL CAREER READINESS
            </span>

            <h2>
                {skillProgressPercentage}%
            </h2>

        </div>

        <div className="readiness-bar">

            <div
                className="readiness-fill"
                style={{
                    width: `${skillProgressPercentage}%`
                }}
            />

        </div>

    </div>


    <div className="individual-skills">

        {skillProgress.length === 0 ? (

            <p className="no-skills-message">
    You have completed all the skills required for this career.
</p>
        ) : (

            skillProgress.map(skill => (

                <div
                    className="tracked-skill"
                    key={skill.skill_id}
                >

                    <div className="tracked-skill-header">

                        <div>

                            <h3>
                                {skill.skill_name}
                            </h3>

                            <span>
                                {skill.category}
                            </span>

                        </div>

                        <div className="tracked-skill-level">

                            {skill.skill_level}

                        </div>

                    </div>


                    <div className="skill-progress-bar">

                        <div
                            className="skill-progress-fill"
                            style={{
                                width:
                                    `${skill.progress_percentage}%`
                            }}
                        />

                    </div>


                    <div className="tracked-skill-footer">

    <span>
        {skill.progress_percentage}% complete
    </span>

    <select
        value={skill.progress_percentage}
        onChange={(e) =>
            handleUpdateSkillProgress(
                skill.skill_id,
                Number(e.target.value)
            )
        }
    >
        <option value="0">0%</option>
        <option value="10">10%</option>
        <option value="20">20%</option>
        <option value="30">30%</option>
        <option value="40">40%</option>
        <option value="50">50%</option>
        <option value="60">60%</option>
        <option value="70">70%</option>
        <option value="80">80%</option>
        <option value="90">90%</option>
        <option value="100">100%</option>
    </select>

</div>

                </div>

            ))

        )}

    </div>

</section>




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

                            const stageSkills = effectiveRoadmap.filter(
    skill => skill.roadmap_stage === stage
);

const stagePercentage =
    stageSkills.length > 0
        ? Math.round(
            stageSkills.reduce(
                (total, skill) =>
                    total + (skill.progress_percentage ?? 0),
                0
            ) / stageSkills.length
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

                                                        {skill.status === "completed"
    ? "Completed"
    : skill.status === "started"
        ? "Started"
        : "Not Started"
}

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