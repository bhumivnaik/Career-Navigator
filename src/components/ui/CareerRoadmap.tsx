import { useEffect, useState } from "react";
import axios from "axios";
import "../../css/roadmap.css";

type RoadmapSkill = {
    skill_id: number;
    skill_name: string;
    category: string;
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
                                    return (
                                        <div className="roadmap-item" key={skill.skill_id} >
                                            <div className={`roadmap-node ${skill.status === "completed"
                                                ? "completed" : "not-started"}`} >
                                                {skill.status === "completed"
                                                    ? "✓" : index + 1}
                                            </div>
                                            <div className="roadmap-card">
                                                <div className="sub">
                                                    <div className="roadmap-stage"> Stage {skill.roadmap_stage}  </div>
                                                    <h3>{skill.skill_name}</h3>
                                                </div>
                                                {/* <p>{skill.skill_level} level </p> */}
                                                <span className={`roadmap-status ${skill.status === "completed"
                                                    ? "status-completed" : "status-not-started"}`} >
                                                    {skill.status === "completed"
                                                        ? "Completed" : "Not Started"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CareerRoadmap;