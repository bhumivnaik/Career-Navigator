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
    isSelected: boolean;
    onCompareToggle: () => void;
    compareMode: boolean;
};

function CareerCard({
    career,
    isSelected,
    onCompareToggle,
    compareMode
}: CareerCardProps) {

    const navigate = useNavigate();

    return (
        <div className="career-card">

            <div className="career-card-top">
                <div>
                    <h3>{career.career_name}</h3>

                    <span className="career-category">
                        {career.category}
                    </span>
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

            <div className="career-card-actions">

                <button
                    className="career-button"
                    onClick={() =>
                        navigate(`/careers/${career.career_id}`)
                    }
                >
                    View Career →
                </button>

                {compareMode && (
                    <button
                        className={`compare-button ${
                            isSelected ? "selected" : ""
                        }`}
                        onClick={onCompareToggle}
                    >
                        {isSelected
                            ? "✓ Added to Compare"
                            : "＋ Add to Compare"}
                    </button>
                )}

            </div>

        </div>
    );
}

export default CareerCard;