import { useNavigate } from "react-router-dom";
import "../../css/careerCard.css";

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

type CareerCardProps = {
    career: Career;
};

function CareerCard({ career }: CareerCardProps) {

    const navigate = useNavigate();

    return (
        <div className="career-card">
            <div className="career-card-top">
                <div>
                    <h3>{career.career_name}</h3>
                    <span className="career-category">{career.category}</span>
                </div>
                <div className="career-match">
                    {career.match_percentage}%
                    <small>match</small>
                </div>
            </div>

            <p className="career-description">
                {career.description?.length > 100
                    ? career.description.substring(0, 100) + "..."
                    : career.description}
            </p>

            <button className="career-button"
                onClick={() => navigate(`/careers/${career.career_id}`)}>
                View Career →
            </button>
        </div>
    );
}

export default CareerCard;