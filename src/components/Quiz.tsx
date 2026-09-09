import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar";
import "../css/quiz.css";

type Skill = {
    skill_id: number;
    skill_name: string;
    category: string;
};

type QuizQuestion = {
    question_id: number;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
};

type QuizResult = {
    score: number;
    total_questions: number;
    percentage: number;
    level: "Beginner" | "Developing" | "Proficient";
    recommendation: string;
};

function Quiz() {

    const navigate = useNavigate();

    const [skills, setSkills] = useState<Skill[]>([]);
    const [selectedSkill, setSelectedSkill] = useState<number | null>(null);

    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    const [answers, setAnswers] = useState<Record<number, string>>({});

    const [loading, setLoading] = useState(false);
    const [loadingSkills, setLoadingSkills] = useState(true);

    const [quizStarted, setQuizStarted] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);

    const token = localStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`
    };


    // Load user's selected skills
    useEffect(() => {

        const loadSkills = async () => {

            try {

                const response = await axios.get(
                    "http://localhost:5000/api/skills/user",
                    { headers }
                );

                setSkills(response.data);

            } catch (error) {

                console.error(
                    "LOAD QUIZ SKILLS ERROR:",
                    error
                );

            } finally {

                setLoadingSkills(false);

            }
        };

        loadSkills();

    }, []);


    // Start quiz for selected skill
    const startQuiz = async () => {

        if (!selectedSkill) {
            alert("Please select a skill first.");
            return;
        }

        try {

            setLoading(true);

            const response = await axios.get(
                `http://localhost:5000/api/skills/quiz/${selectedSkill}`,
                { headers }
            );

            setQuestions(response.data);
            setCurrentQuestion(0);
            setAnswers({});
            setResult(null);
            setQuizStarted(true);

        } catch (error) {

            console.error(
                "LOAD QUIZ ERROR:",
                error
            );

            alert(
                "Unable to load quiz questions for this skill."
            );

        } finally {

            setLoading(false);

        }
    };


    // Select an answer
    const selectAnswer = (option: string) => {

        const question = questions[currentQuestion];

        setAnswers(prev => ({
            ...prev,
            [question.question_id]: option
        }));

    };


    // Go to next question
    const handleNext = () => {

        if (currentQuestion < questions.length - 1) {

            setCurrentQuestion(prev => prev + 1);

        }

    };


    // Go to previous question
    const handlePrevious = () => {

        if (currentQuestion > 0) {

            setCurrentQuestion(prev => prev - 1);

        }

    };


    // Submit quiz
    const submitQuiz = async () => {

        if (Object.keys(answers).length !== questions.length) {

            alert(
                "Please answer all questions before submitting."
            );

            return;
        }

        try {

            setLoading(true);

            const formattedAnswers = questions.map(question => ({
                question_id: question.question_id,
                selected_option: answers[question.question_id]
            }));

            const response = await axios.post(
                "http://localhost:5000/api/quiz/submit",
                {
                    answers: formattedAnswers
                },
                {
                    headers
                }
            );

            setResult(response.data);
            setQuizStarted(false);

        } catch (error) {

            console.error(
                "SUBMIT QUIZ ERROR:",
                error
            );

            alert("Failed to submit quiz.");

        } finally {

            setLoading(false);

        }
    };


    // Restart quiz
    const retakeQuiz = () => {

        setQuestions([]);
        setAnswers({});
        setCurrentQuestion(0);
        setResult(null);
        setQuizStarted(false);

    };


    // Loading skills
    if (loadingSkills) {

        return (
            <div className="dashboard-layout">

                <Navbar />

                <main className="dashboard-content">

                    <div className="quiz-loading">
                        Loading your skills...
                    </div>

                </main>

            </div>
        );

    }


    // Quiz result
    if (result) {

        return (

            <div className="dashboard-layout">

                <Navbar />

                <main className="dashboard-content">

                    <section className="quiz-result-card">

                        <p className="dashboard-label">
                            QUIZ RESULT
                        </p>

                        <h1>
                            {result.percentage}%
                        </h1>

                        <h2>
                            {result.level}
                        </h2>

                        <p className="quiz-score">
                            You scored {result.score} out of{" "}
                            {result.total_questions}
                        </p>

                        <div className="quiz-recommendation">

                            <h3>
                                Recommendation
                            </h3>

                            <p>
                                {result.recommendation}
                            </p>

                        </div>

                        <div className="quiz-result-actions">

                            <button
                                className="quiz-primary-button"
                                onClick={retakeQuiz}
                            >
                                Retake Quiz
                            </button>

                            <button
                                className="quiz-secondary-button"
                                onClick={() =>
                                    navigate("/progress")
                                }
                            >
                                View Progress
                            </button>

                        </div>

                    </section>

                </main>

            </div>

        );

    }


    // Skill selection screen
    if (!quizStarted) {

        return (

            <div className="dashboard-layout">

                <Navbar />

                <main className="dashboard-content">

                    <div className="quiz-header">

                        <div>

                            <p className="dashboard-label">
                                PERSONALIZED SKILL QUIZ
                            </p>

                            <h1>
                                Test Your Knowledge
                            </h1>

                            <p>
                                Select a skill and take a short
                                quiz to check your current
                                knowledge level.
                            </p>

                        </div>

                    </div>


                    {skills.length === 0 ? (

                        <section className="quiz-empty-card">

                            <h2>
                                No Selected Skills
                            </h2>

                            <p>
                                Select some skills first before
                                taking a quiz.
                            </p>

                            <button
                                onClick={() =>
                                    navigate("/skills-setup")
                                }
                            >
                                Select Skills →
                            </button>

                        </section>

                    ) : (

                        <section className="quiz-selection-card">

                            <h2>
                                Choose a Skill
                            </h2>

                            <p>
                                Choose one of your selected skills
                                to begin the quiz.
                            </p>


                            <div className="quiz-skill-list">

                                {skills.map(skill => (

                                    <button
                                        key={skill.skill_id}
                                        className={
                                            selectedSkill === skill.skill_id
                                                ? "quiz-skill selected"
                                                : "quiz-skill"
                                        }
                                        onClick={() =>
                                            setSelectedSkill(
                                                skill.skill_id
                                            )
                                        }
                                    >

                                        <div>

                                            <strong>
                                                {skill.skill_name}
                                            </strong>

                                            <span>
                                                {skill.category}
                                            </span>

                                        </div>

                                    </button>

                                ))}

                            </div>


                            <button
                                className="quiz-start-button"
                                onClick={startQuiz}
                                disabled={
                                    !selectedSkill || loading
                                }
                            >
                                {loading
                                    ? "Loading Quiz..."
                                    : "Start Quiz →"}
                            </button>

                        </section>

                    )}

                </main>

            </div>

        );

    }


    // Current question
    const question = questions[currentQuestion];

    const selectedAnswer =
        answers[question.question_id];


    return (

        <div className="dashboard-layout">

            <Navbar />

            <main className="dashboard-content">

                <section className="quiz-question-card">

                    <div className="quiz-question-header">

                        <div>

                            <p className="dashboard-label">
                                PERSONALIZED SKILL QUIZ
                            </p>

                            <h1>
                                Question {currentQuestion + 1} of{" "}
                                {questions.length}
                            </h1>

                        </div>

                        <span className="quiz-progress-text">
                            {Math.round(
                                ((currentQuestion + 1) /
                                    questions.length) *
                                    100
                            )}%
                        </span>

                    </div>


                    <div className="quiz-question-progress">

                        <div
                            style={{
                                width: `${
                                    ((currentQuestion + 1) /
                                        questions.length) *
                                    100
                                }%`
                            }}
                        />

                    </div>


                    <div className="quiz-question-content">

                        <h2>
                            {question.question_text}
                        </h2>


                        <div className="quiz-options">

                            {[
                                ["A", question.option_a],
                                ["B", question.option_b],
                                ["C", question.option_c],
                                ["D", question.option_d]
                            ].map(([letter, text]) => (

                                <button
                                    key={letter}
                                    className={
                                        selectedAnswer === letter
                                            ? "quiz-option selected"
                                            : "quiz-option"
                                    }
                                    onClick={() =>
                                        selectAnswer(letter)
                                    }
                                >

                                    <span className="quiz-option-letter">
                                        {letter}
                                    </span>

                                    <span>
                                        {text}
                                    </span>

                                </button>

                            ))}

                        </div>

                    </div>


                    <div className="quiz-navigation">

                        <button
                            className="quiz-secondary-button"
                            onClick={handlePrevious}
                            disabled={currentQuestion === 0}
                        >
                            ← Previous
                        </button>


                        {currentQuestion === questions.length - 1 ? (

                            <button
                                className="quiz-primary-button"
                                onClick={submitQuiz}
                                disabled={loading}
                            >
                                {loading
                                    ? "Submitting..."
                                    : "Submit Quiz"}
                            </button>

                        ) : (

                            <button
                                className="quiz-primary-button"
                                onClick={handleNext}
                            >
                                Next →
                            </button>

                        )}

                    </div>

                </section>

            </main>

        </div>

    );
}

export default Quiz;