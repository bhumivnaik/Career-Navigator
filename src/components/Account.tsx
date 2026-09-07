import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import Navbar from "../components/ui/Navbar";
import "../css/account.css";

type Education = {
    education_id: number;
    degree: string;
    field_of_study: string;
    institution: string;
    start_year: number;
    end_year: number;
    skills?: string[];
};

type Course = {
    course_id: number;
    course_name: string;
    provider: string;
    description: string;
    completion_date: string;
    certificate_url?: string;
    skills?: string[];
};

type Experience = {
    experience_id: number;
    experience_type: string;
    job_title: string;
    company_name: string;
    description: string;
    start_date: string;
    end_date?: string;
    skills?: string[];
};

type Project = {
    project_id: number;
    project_name: string;
    description: string;
    start_date: string;
    end_date?: string;
    skills?: string[];
};

function Account() {

    const { user, login } = useAuth();

    const [education, setEducation] = useState<Education[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [experience, setExperience] = useState<Experience[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`
    };

    useEffect(() => {

        loadAccountData();

    }, []);

    const loadAccountData = async () => {

        try {

            const [
                educationResponse,
                coursesResponse,
                experienceResponse,
                projectsResponse
            ] = await Promise.all([

                axios.get(
                    "http://localhost:5000/api/education",
                    { headers }
                ),

                axios.get(
                    "http://localhost:5000/api/courses",
                    { headers }
                ),

                axios.get(
                    "http://localhost:5000/api/experience",
                    { headers }
                ),

                axios.get(
                    "http://localhost:5000/api/projects",
                    { headers }
                )

            ]);

            setEducation(educationResponse.data);
            setCourses(coursesResponse.data);
            setExperience(experienceResponse.data);
            setProjects(projectsResponse.data);

        } catch (error) {

            console.error("ACCOUNT DATA ERROR:", error);

        } finally {

            setLoading(false);

        }
    };


    return (
        <>
            <Navbar />

            <main className="account-page">
                <div className="account-header">
                    <h1>Profile</h1>
                    <p>
                        Manage your account and career information
                    </p>
                </div>


                {/* PROFILE */}

                <section className="profile-card">
                    <div className="profile-avatar">
                        {user?.full_name?.split(" ").map((name) => name[0])
                            .join("").slice(0, 2).toUpperCase() || "U"}
                    </div>
                    <div>
                        <div className="profile-card-top">

                            <div className="profile-main">
                                <div className="profile-name-row">
                                    <div>
                                        <h1>{user?.full_name || "Your Name"}</h1>
                                        <p className="profile-subtitle">
                                            {user?.career_goal_name
                                                ? `Aspiring ${user.career_goal_name}`
                                                : "Build your career profile"}
                                        </p>
                                    </div>
                                    <button className="profile-edit-button">
                                        ✎ Edit Profile
                                    </button>
                                </div>
                                <p className="profile-about">
                                    {user?.about || "Add a short description about yourself to tell others about your interests, skills and career goals."}
                                </p>
                            </div>
                        </div>

                        <div className="profile-divider"></div>
                        <div className="profile-info-row">
                            <div className="profile-info">
                                <div className="profile-info-icon">
                                    ✉
                                </div>
                                <div>
                                    <span>Email</span>
                                    <strong>{user?.email}</strong>
                                </div>
                            </div>

                            <div className="profile-info">
                                <div className="profile-info-icon">
                                    ◉
                                </div>
                                <div>
                                    <span>GitHub</span>
                                    {user?.github_profile_url ? (
                                        <a
                                            href={user.github_profile_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View Profile ↗
                                        </a>
                                    ) : (
                                        <strong className="not-added">
                                            Not added
                                        </strong>
                                    )}
                                </div>
                            </div>

                            <div className="profile-info">
                                <div className="profile-info-icon">
                                    in
                                </div>
                                <div>
                                    <span>LinkedIn</span>
                                    {user?.linkedin_profile_url ? (
                                        <a
                                            href={user.linkedin_profile_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View Profile ↗
                                        </a>
                                    ) : (
                                        <strong className="not-added">Not added</strong>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CAREER GOAL */}
                <section className="career-goal-section">
                    <div className="career-goal-heading">
                        <div>
                            <h2>Career Destination</h2>
                            <p> The career you're currently working towards</p>
                        </div>
                        {user?.career_goal_id && (
                            <span className="goal-active"> ● Active Goal</span>
                        )}
                    </div>
                    {user?.career_goal_id ? (
                        <div className="career-destination-card">
                            <div className="career-destination-info">
                                <span>YOUR CURRENT GOAL</span>
                                <h3>{user.career_goal_name}</h3>
                                <p>Keep building the skills required to reach your target career. </p>
                            </div>

                            <button className="career-view-button" onClick={() =>
                                window.location.href = `/careers/${user.career_goal_id}`
                            }>
                                View Career<span>→</span>
                            </button>
                        </div>
                    ) : (
                        <div className="career-destination-card no-goal">
                            <div className="career-destination-info">
                                <span>NO CAREER GOAL SELECTED</span>
                                <h3> Choose your career destination </h3>
                                <p> Select a career to get a personalized roadmap and track your progress. </p>
                            </div>
                            <button className="career-view-button"
                                onClick={() => window.location.href = "/careers"}
                            >
                                Explore Careers<span>→</span>
                            </button>
                        </div>
                    )}
                </section>

                {/* EDUCATION */}
                <section className="account-section">
                    <div className="section-header">
                        <div>
                            <h2>Education</h2>
                            <p>Your educational background</p>
                        </div>
                        <button className="add-button">
                            + Add Education
                        </button>
                    </div>
                    <div className="profile-divider"></div>
                    {education.length === 0 ? (
                        <div className="empty-section">
                            No education added yet.
                        </div>
                    ) : (
                        <div className="account-list">
                            {education.map((item) => (
                                <div
                                    className="account-item"
                                    key={item.education_id}
                                >
                                    <div className="item-content">
                                        <h3>
                                            {item.degree}
                                        </h3>

                                        <p>
                                            {item.field_of_study}
                                        </p>

                                        <span>
                                            {item.institution}
                                            {" • "}
                                            {item.start_year}
                                            {" - "}
                                            {item.end_year}
                                        </span>

                                    </div>


                                    <div className="item-actions">

                                        <button>
                                            Edit
                                        </button>

                                        <button className="delete-button">
                                            Delete
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </section>

                {/* COURSES */}
                <section className="account-section">
                    <div className="section-header">
                        <div>
                            <h2>Courses & Certifications</h2>
                            <p>Courses and certifications you completed</p>
                        </div>
                        <button className="add-button">
                            + Add Course
                        </button>
                    </div><hr />
                    <br />

                    {courses.length === 0 ? (
                        <div className="empty-section">
                            No courses added yet.
                        </div>
                    ) : (
                        <div className="account-list">
                            {courses.map((item) => (
                                <div
                                    className="account-item"
                                    key={item.course_id}
                                >

                                    <div className="item-content">

                                        <h3>
                                            {item.course_name}
                                        </h3>

                                        <p>
                                            {item.provider}
                                        </p>

                                        <span>
                                            Completed:
                                            {" "}
                                            {item.completion_date}
                                        </span>

                                    </div>


                                    <div className="item-actions">

                                        <button>
                                            Edit
                                        </button>

                                        <button className="delete-button">
                                            Delete
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </section>

                {/* EXPERIENCE */}
                <section className="account-section">

                    <div className="section-header">

                        <div>
                            <h2>Experience</h2>
                            <p>Your internships and work experience</p>
                        </div>

                        <button className="add-button">
                            + Add Experience
                        </button>

                    </div>
                    <hr />
                    <br />

                    {experience.length === 0 ? (

                        <div className="empty-section">
                            No experience added yet.
                        </div>

                    ) : (

                        <div className="account-list">

                            {experience.map((item) => (

                                <div
                                    className="account-item"
                                    key={item.experience_id}
                                >

                                    <div className="item-content">

                                        <h3>
                                            {item.job_title}
                                        </h3>

                                        <p>
                                            {item.company_name}
                                        </p>

                                        <span>
                                            {item.start_date}
                                            {" - "}
                                            {item.end_date || "Present"}
                                        </span>

                                    </div>


                                    <div className="item-actions">

                                        <button>
                                            Edit
                                        </button>

                                        <button className="delete-button">
                                            Delete
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </section>



                {/* PROJECTS */}

                <section className="account-section">

                    <div className="section-header">

                        <div>
                            <h2>Projects</h2>
                            <p>Projects you have worked on</p>
                        </div>

                        <button className="add-button">
                            + Add Project
                        </button>

                    </div>
                    <hr />
                    <br />

                    {projects.length === 0 ? (

                        <div className="empty-section">
                            No projects added yet.
                        </div>

                    ) : (

                        <div className="account-list">

                            {projects.map((item) => (

                                <div
                                    className="account-item"
                                    key={item.project_id}
                                >

                                    <div className="item-content">

                                        <h3>
                                            {item.project_name}
                                        </h3>

                                        <p>
                                            {item.description}
                                        </p>

                                        <span>
                                            {item.start_date}
                                            {" - "}
                                            {item.end_date || "Present"}
                                        </span>

                                    </div>


                                    <div className="item-actions">

                                        <button>
                                            Edit
                                        </button>

                                        <button className="delete-button">
                                            Delete
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </section>

            </main>
        </>
    );
}

export default Account;