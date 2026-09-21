import { useEffect, useState } from "react";
import axios from "axios";
import "../../css/roadmap.css";
import { BookOpen, PlayCircle, ExternalLink } from "lucide-react";

type RoadmapSkill = {
    skill_id: number;
    skill_name: string;
    category: string;
    description: string;
    documentation_url: string | null;
    youtube_url: string | null;
    learning_topics: string;
    skill_level: "Beginner" | "Intermediate" | "Advanced";
    roadmap_stage: number;
    sequence_order: number;
    status: "completed" | "not_started";
};

type CareerRoadmapProps = {
    careerId: number;
};

function CareerRoadmap({ careerId }: CareerRoadmapProps) {
    const [roadmap, setRoadmap] = useState<RoadmapSkill[]>([]);
    const [loading, setLoading] = useState(true);

    const [openSkillId, setOpenSkillId] = useState<number | null>(null);

    useEffect(() => {
        async function loadRoadmap() {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `http://localhost:5000/api/careers/${careerId}/roadmap`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log("CAREER ROADMAP:", response.data);
                setRoadmap(response.data);
            } catch (error) {
                console.error("CAREER ROADMAP API ERROR:", error);
            } finally {
                setLoading(false);
            }
        }
        loadRoadmap();
    }, [careerId]);

    if (loading) {
        return (
            <div className="roadmap-loading">
                Loading roadmap...
            </div>
        );
    }

    if (roadmap.length === 0) {
        return (
            <div className="roadmap-empty">
                No roadmap available for this career.
            </div>
        );
    }

    const toggleSkill = (skillId: number) => {
        setOpenSkillId(openSkillId === skillId ? null : skillId);
    };

    return (
        <div className="career-roadmap">
            <div className="roadmap-line">
                {["Beginner", "Intermediate", "Advanced"].map((level) => {
                    const levelSkills = roadmap.filter((skill) => skill.skill_level === level);
                    if (levelSkills.length === 0) return null;
                    return (
                        <div className={`roadmap-level-group level-${level.toLowerCase()}`} key={level}>
                            <div className="roadmap-level-title"> {level} </div>
                            <div className="roadmap-level-skills">
                                {levelSkills.map((skill) => {
                                    const index = roadmap.findIndex(
                                        (item) => item.skill_id === skill.skill_id
                                    );
                                    const isOpen = openSkillId === skill.skill_id;

                                    return (
                                        <div className="roadmap-item" key={skill.skill_id} >
                                            <div className={`roadmap-node ${skill.status === "completed"
                                                ? "completed" : "not-started"}`} >
                                                {skill.status === "completed"
                                                    ? "✓" : index + 1}
                                            </div>
                                            <div className="roadmap-card">
                                                <div className="roadmap-card-header">
                                                    <div className="sub">
                                                        <div className="roadmap-stage"> Stage {skill.roadmap_stage}  </div>
                                                        <h3>{skill.skill_name}</h3>
                                                    </div>
                                                    <div className="roadmap-card-actions">
                                                        {/* <p>{skill.skill_level} level </p> */}
                                                        <span className={`roadmap-status ${skill.status === "completed"
                                                            ? "status-completed" : "status-not-started"}`} >
                                                            {skill.status === "completed"
                                                                ? "Completed" : "Not Started"}
                                                        </span>
                                                        <button type="button" className={`roadmap-toggle ${isOpen ? "open" : ""}`} onClick={() => toggleSkill(skill.skill_id)} aria-label={isOpen ? `Close ${skill.skill_name} details` : `Open ${skill.skill_name} details`} >
                                                            {isOpen ? "⌃" : "⌄"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {isOpen && (
                                                    <div className="roadmap-details">
                                                        {/* Description */}
                                                        <div className="roadmap-detail-section">
                                                            <h4>About this skill</h4>
                                                            <p>
                                                                {skill.description ||
                                                                    "No description available for this skill."}
                                                            </p>
                                                        </div>


                                                        {/* Learning Topics */}
                                                        {skill.learning_topics && (
                                                            <div className="roadmap-learning-topics">

                                                                <h4>What you'll learn</h4>

                                                                <ul>
                                                                    {skill.learning_topics
                                                                        .split("|")
                                                                        .map((topic, index) => (
                                                                            <li key={index}>
                                                                                {topic}
                                                                            </li>
                                                                        ))}
                                                                </ul>

                                                            </div>
                                                        )}


                                                        {/* Resources */}
                                                        {(skill.documentation_url || skill.youtube_url) && (
                                                            <div>
                                                                <h4>Learning Resources</h4>
                                                                <div className="roadmap-resources">

                                                                    {skill.documentation_url && (
                                                                        <a
                                                                            href={skill.documentation_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="roadmap-resource"
                                                                        >
                                                                            <div className="resource-icon">
                                                                                <BookOpen size={18} strokeWidth={1.8} />
                                                                            </div>

                                                                            <div className="resource-content">
                                                                                <span className="resource-title">
                                                                                    Documentation
                                                                                </span>

                                                                                <span className="resource-description">
                                                                                    Read the official documentation and learn the
                                                                                    concepts in detail.
                                                                                </span>
                                                                            </div>

                                                                            <ExternalLink
                                                                                className="resource-arrow"
                                                                                size={16}
                                                                                strokeWidth={1.8}
                                                                            />
                                                                        </a>
                                                                    )}

                                                                    {skill.youtube_url && (
                                                                        <a
                                                                            href={skill.youtube_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="roadmap-resource"
                                                                        >
                                                                            <div className="resource-icon">
                                                                                <PlayCircle size={18} strokeWidth={1.8} />
                                                                            </div>

                                                                            <div className="resource-content">
                                                                                <span className="resource-title">
                                                                                    Learn on YouTube
                                                                                </span>

                                                                                <span className="resource-description">
                                                                                    Watch tutorials and follow practical
                                                                                    explanations to build your skills.
                                                                                </span>
                                                                            </div>

                                                                            <ExternalLink
                                                                                className="resource-arrow"
                                                                                size={16}
                                                                                strokeWidth={1.8}
                                                                            />
                                                                        </a>
                                                                    )}

                                                                </div>
                                                            </div>
                                                        )}

                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div >
        </div >
    );
}

export default CareerRoadmap;