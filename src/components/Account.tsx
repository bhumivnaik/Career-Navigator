import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
    const location = useLocation();

    const navigate = useNavigate();

    const [education, setEducation] = useState<Education[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [experience, setExperience] = useState<Experience[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    const [loading, setLoading] = useState(true);
    const [showEducationForm, setShowEducationForm] = useState(false);
const [editingEducation, setEditingEducation] = useState<Education | null>(null);

const [educationForm, setEducationForm] = useState({
    degree: "",
    field_of_study: "",
    institution: "",
    start_year: "",
    end_year: "",
});

const [showCourseForm, setShowCourseForm] = useState(false);
const [editingCourse, setEditingCourse] = useState<Course | null>(null);

const [courseForm, setCourseForm] = useState({
    course_name: "",
    provider: "",
    description: "",
    completion_date: "",
    certificate_url: "",
});
const [showExperienceForm, setShowExperienceForm] = useState(false);
const [editingExperience, setEditingExperience] = useState<Experience | null>(null);

const [experienceForm, setExperienceForm] = useState({
    experience_type: "",
    job_title: "",
    company_name: "",
    description: "",
    start_date: "",
    end_date: "",
});
const [showProjectForm, setShowProjectForm] = useState(false);
const [editingProject, setEditingProject] = useState<Project | null>(null);

const [projectForm, setProjectForm] = useState({
    project_name: "",
    description: "",
    start_date: "",
    end_date: "",
});

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
                    "http://localhost:5000/api/profile/education",
                    { headers }
                ),

                axios.get(
                    "http://localhost:5000/api/profile/course",
                    { headers }
                ),

                axios.get(
                    "http://localhost:5000/api/profile/experience",
                    { headers }
                ),

                axios.get(
                    "http://localhost:5000/api/profile/project",
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
    const handleAddEducation = () => {
    setEditingEducation(null);

    setEducationForm({
        degree: "",
        field_of_study: "",
        institution: "",
        start_year: "",
        end_year: "",
    });

    setShowEducationForm(true);
};

const handleEditEducation = (item: Education) => {
    setEditingEducation(item);

    setEducationForm({
        degree: item.degree,
        field_of_study: item.field_of_study,
        institution: item.institution,
        start_year: item.start_year.toString(),
        end_year: item.end_year.toString(),
    });

    setShowEducationForm(true);
};

const handleSaveEducation = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        const data = {
            degree: educationForm.degree,
            field_of_study: educationForm.field_of_study,
            institution: educationForm.institution,
            start_year: Number(educationForm.start_year),
            end_year: Number(educationForm.end_year),
            skill_ids: [],
        };

        if (editingEducation) {
            await axios.put(
                `http://localhost:5000/api/profile/education/${editingEducation.education_id}`,
                data,
                { headers }
            );
        } else {
            await axios.post(
                "http://localhost:5000/api/profile/education",
                data,
                { headers }
            );
        }

        setShowEducationForm(false);
        setEditingEducation(null);

        await loadAccountData();

    } catch (error) {
        console.error("EDUCATION SAVE ERROR:", error);
    }
};

const handleDeleteEducation = async (educationId: number) => {
    const confirmDelete = window.confirm(
        "Are you sure you want to delete this education?"
    );

    if (!confirmDelete) return;

    try {
        await axios.delete(
            `http://localhost:5000/api/profile/education/${educationId}`,
            { headers }
        );

        await loadAccountData();

    } catch (error) {
        console.error("EDUCATION DELETE ERROR:", error);
    }
};
const handleAddCourse = () => {
    setEditingCourse(null);

    setCourseForm({
        course_name: "",
        provider: "",
        description: "",
        completion_date: "",
        certificate_url: "",
    });

    setShowCourseForm(true);
};
const handleEditCourse = (item: Course) => {
    setEditingCourse(item);

    setCourseForm({
        course_name: item.course_name,
        provider: item.provider,
        description: item.description,
        completion_date: item.completion_date,
        certificate_url: item.certificate_url || "",
    });

    setShowCourseForm(true);
};
const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        const data = {
            course_name: courseForm.course_name,
            provider: courseForm.provider,
            description: courseForm.description,
            completion_date: courseForm.completion_date,
            certificate_url: courseForm.certificate_url,
            skill_ids: [],
        };

        if (editingCourse) {
            await axios.put(
                `http://localhost:5000/api/profile/course/${editingCourse.course_id}`,
                data,
                { headers }
            );
        } else {
            await axios.post(
                "http://localhost:5000/api/profile/course",
                data,
                { headers }
            );
        }

        setShowCourseForm(false);
        setEditingCourse(null);

        await loadAccountData();

    } catch (error) {
        console.error("COURSE SAVE ERROR:", error);
    }
};
const handleDeleteCourse = async (courseId: number) => {
    const confirmDelete = window.confirm(
        "Are you sure you want to delete this course?"
    );

    if (!confirmDelete) return;

    try {
        await axios.delete(
            `http://localhost:5000/api/profile/course/${courseId}`,
            { headers }
        );

        await loadAccountData();

    } catch (error) {
        console.error("COURSE DELETE ERROR:", error);
    }
};

const handleAddExperience = () => {
    setEditingExperience(null);

    setExperienceForm({
        experience_type: "",
        job_title: "",
        company_name: "",
        description: "",
        start_date: "",
        end_date: "",
    });

    setShowExperienceForm(true);
};
const handleEditExperience = (item: Experience) => {
    setEditingExperience(item);

    setExperienceForm({
        experience_type: item.experience_type,
        job_title: item.job_title,
        company_name: item.company_name,
        description: item.description,
        start_date: item.start_date,
        end_date: item.end_date || "",
    });

    setShowExperienceForm(true);
};
const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        const data = {
            experience_type: experienceForm.experience_type,
            job_title: experienceForm.job_title,
            company_name: experienceForm.company_name,
            description: experienceForm.description,
            start_date: experienceForm.start_date,
            end_date: experienceForm.end_date || null,
            skill_ids: [],
        };

        console.log("SAVE EXPERIENCE CLICKED");
        console.log("EXPERIENCE DATA:", data);

        if (editingExperience) {
            console.log("UPDATING EXPERIENCE");

            await axios.put(
                `http://localhost:5000/api/profile/experience/${editingExperience.experience_id}`,
                data,
                { headers }
            );
        } else {
            console.log("ADDING EXPERIENCE");

            await axios.post(
                "http://localhost:5000/api/profile/experience",
                data,
                { headers }
            );
        }

        console.log("EXPERIENCE SAVED");

        setShowExperienceForm(false);
        setEditingExperience(null);

        await loadAccountData();

    } catch (error: any) {
        console.error("EXPERIENCE SAVE ERROR:", error);
        console.error("SERVER RESPONSE:", error.response?.data);
    }
};
const handleDeleteExperience = async (experienceId: number) => {
    const confirmDelete = window.confirm(
        "Are you sure you want to delete this experience?"
    );

    if (!confirmDelete) return;

    try {
        await axios.delete(
            `http://localhost:5000/api/profile/experience/${experienceId}`,
            { headers }
        );

        await loadAccountData();

    } catch (error) {
        console.error("EXPERIENCE DELETE ERROR:", error);
    }
};
const handleAddProject = () => {
    setEditingProject(null);

    setProjectForm({
        project_name: "",
        description: "",
        start_date: "",
        end_date: "",
    });

    setShowProjectForm(true);
};

const handleEditProject = (item: Project) => {
    setEditingProject(item);

    setProjectForm({
        project_name: item.project_name,
        description: item.description,
        start_date: item.start_date,
        end_date: item.end_date || "",
    });

    setShowProjectForm(true);
};

const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        const data = {
            project_name: projectForm.project_name,
            description: projectForm.description,
            start_date: projectForm.start_date,
            end_date: projectForm.end_date || null,
            skill_ids: [],
        };

        if (editingProject) {
            await axios.put(
                `http://localhost:5000/api/profile/project/${editingProject.project_id}`,
                data,
                { headers }
            );
        } else {
            await axios.post(
                "http://localhost:5000/api/profile/project",
                data,
                { headers }
            );
        }

        setShowProjectForm(false);
        setEditingProject(null);

        await loadAccountData();

    } catch (error: any) {
        console.error("PROJECT SAVE ERROR:", error);
        console.error("SERVER RESPONSE:", error.response?.data);
    }
};

const handleDeleteProject = async (projectId: number) => {
    const confirmDelete = window.confirm(
        "Are you sure you want to delete this project?"
    );

    if (!confirmDelete) return;

    try {
        await axios.delete(
            `http://localhost:5000/api/profile/project/${projectId}`,
            { headers }
        );

        await loadAccountData();

    } catch (error: any) {
        console.error("PROJECT DELETE ERROR:", error);
        console.error("SERVER RESPONSE:", error.response?.data);
    }
};
useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openSection = params.get("open");

    if (openSection === "education") {
        handleAddEducation();
    }

    if (openSection === "courses") {
        handleAddCourse();
    }

    if (openSection === "experience") {
        handleAddExperience();
    }

    if (openSection === "projects") {
        handleAddProject();
    }

    if (openSection) {
        navigate("/account", { replace: true });
    }
}, [location.search]);
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
                        <button
    className="add-button"
    onClick={handleAddEducation}
>
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

                                        <button onClick={() => handleEditEducation(item)}>
                                            Edit
                                        </button>

                                        <button className="delete-button" onClick={() => handleDeleteEducation(item.education_id)}>
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
                        <button
    type="button"
    className="add-button"
    onClick={handleAddCourse}
>
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

                                        <button
    type="button"
    onClick={() => handleEditCourse(item)}
>
    Edit
</button>

<button
    type="button"
    className="delete-button"
    onClick={() => handleDeleteCourse(item.course_id)}
>
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

                        <button
    type="button"
    className="add-button"
    onClick={handleAddExperience}
>
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

                                        <button
    type="button"
    onClick={() => handleEditExperience(item)}
>
    Edit
</button>

<button
    type="button"
    className="delete-button"
    onClick={() =>
        handleDeleteExperience(item.experience_id)
    }
>
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

                        <button
    type="button"
    className="add-button"
    onClick={handleAddProject}
>
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
                    <h3>{item.project_name}</h3>

                    <p>{item.description}</p>

                    <span>
                        {item.start_date}
                        {" - "}
                        {item.end_date || "Present"}
                    </span>
                </div>

                <div className="item-actions">
                    <button
                        type="button"
                        onClick={() => handleEditProject(item)}
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                            handleDeleteProject(item.project_id)
                        }
                    >
                        Delete
                    </button>
                </div>
            </div>
        ))}
    </div>
)}
                    

                </section>
                {showEducationForm && (
    <div className="modal-overlay">
        <div className="modal">

            <div className="modal-header">
                <h2>
                    {editingEducation
                        ? "Edit Education"
                        : "Add Education"}
                </h2>

                <button
                    className="modal-close"
                    onClick={() => setShowEducationForm(false)}
                >
                    ×
                </button>
            </div>

            <form onSubmit={handleSaveEducation}>

                <label>Degree</label>
                <input
                    type="text"
                    value={educationForm.degree}
                    onChange={(e) =>
                        setEducationForm({
                            ...educationForm,
                            degree: e.target.value,
                        })
                    }
                    required
                />

                <label>Field of Study</label>
                <input
                    type="text"
                    value={educationForm.field_of_study}
                    onChange={(e) =>
                        setEducationForm({
                            ...educationForm,
                            field_of_study: e.target.value,
                        })
                    }
                    required
                />

                <label>Institution</label>
                <input
                    type="text"
                    value={educationForm.institution}
                    onChange={(e) =>
                        setEducationForm({
                            ...educationForm,
                            institution: e.target.value,
                        })
                    }
                    required
                />

                <label>Start Year</label>
                <input
                    type="number"
                    value={educationForm.start_year}
                    onChange={(e) =>
                        setEducationForm({
                            ...educationForm,
                            start_year: e.target.value,
                        })
                    }
                    required
                />

                <label>End Year</label>
                <input
                    type="number"
                    value={educationForm.end_year}
                    onChange={(e) =>
                        setEducationForm({
                            ...educationForm,
                            end_year: e.target.value,
                        })
                    }
                    required
                />

                <div className="modal-actions">

                    <button
                        type="button"
                        onClick={() => setShowEducationForm(false)}
                    >
                        Cancel
                    </button>

                    <button type="submit">
                        {editingEducation
                            ? "Update Education"
                            : "Save Education"}
                    </button>

                </div>

            </form>
        </div>
    </div>
)}
{showCourseForm && (
    <div className="modal-overlay">

        <div className="modal">

            <div className="modal-header">

                <h2>
                    {editingCourse
                        ? "Edit Course"
                        : "Add Course"}
                </h2>

                <button
                    type="button"
                    className="modal-close"
                    onClick={() => setShowCourseForm(false)}
                >
                    ×
                </button>

            </div>

            <form onSubmit={handleSaveCourse}>

                <label>Course Name</label>

                <input
                    type="text"
                    value={courseForm.course_name}
                    onChange={(e) =>
                        setCourseForm({
                            ...courseForm,
                            course_name: e.target.value,
                        })
                    }
                    required
                />


                <label>Provider</label>

                <input
                    type="text"
                    value={courseForm.provider}
                    onChange={(e) =>
                        setCourseForm({
                            ...courseForm,
                            provider: e.target.value,
                        })
                    }
                    required
                />


                <label>Description</label>

                <textarea
                    value={courseForm.description}
                    onChange={(e) =>
                        setCourseForm({
                            ...courseForm,
                            description: e.target.value,
                        })
                    }
                    required
                />


                <label>Completion Date</label>

                <input
                    type="date"
                    value={courseForm.completion_date}
                    onChange={(e) =>
                        setCourseForm({
                            ...courseForm,
                            completion_date: e.target.value,
                        })
                    }
                    required
                />


                <label>Certificate URL</label>

                <input
                    type="url"
                    value={courseForm.certificate_url}
                    onChange={(e) =>
                        setCourseForm({
                            ...courseForm,
                            certificate_url: e.target.value,
                        })
                    }
                    placeholder="https://..."
                />


                <div className="modal-actions">

                    <button
                        type="button"
                        onClick={() =>
                            setShowCourseForm(false)
                        }
                    >
                        Cancel
                    </button>

                    <button type="submit">
                        {editingCourse
                            ? "Update Course"
                            : "Save Course"}
                    </button>

                </div>

            </form>

        </div>

    </div>
)}
{showExperienceForm && (
    <div className="modal-overlay">

        <div className="modal">

            <div className="modal-header">

                <h2>
                    {editingExperience
                        ? "Edit Experience"
                        : "Add Experience"}
                </h2>

                <button
                    type="button"
                    className="modal-close"
                    onClick={() => setShowExperienceForm(false)}
                >
                    ×
                </button>

            </div>

            <form onSubmit={handleSaveExperience}>

                <label>Experience Type</label>

                <input
                    type="text"
                    value={experienceForm.experience_type}
                    onChange={(e) =>
                        setExperienceForm({
                            ...experienceForm,
                            experience_type: e.target.value,
                        })
                    }
                    placeholder="Internship / Full-time / Part-time"
                    required
                />


                <label>Job Title</label>

                <input
                    type="text"
                    value={experienceForm.job_title}
                    onChange={(e) =>
                        setExperienceForm({
                            ...experienceForm,
                            job_title: e.target.value,
                        })
                    }
                    required
                />


                <label>Company Name</label>

                <input
                    type="text"
                    value={experienceForm.company_name}
                    onChange={(e) =>
                        setExperienceForm({
                            ...experienceForm,
                            company_name: e.target.value,
                        })
                    }
                    required
                />


                <label>Description</label>

                <textarea
                    value={experienceForm.description}
                    onChange={(e) =>
                        setExperienceForm({
                            ...experienceForm,
                            description: e.target.value,
                        })
                    }
                    required
                />


                <label>Start Date</label>

                <input
                    type="date"
                    value={experienceForm.start_date}
                    onChange={(e) =>
                        setExperienceForm({
                            ...experienceForm,
                            start_date: e.target.value,
                        })
                    }
                    required
                />


                <label>End Date</label>

                <input
                    type="date"
                    value={experienceForm.end_date}
                    onChange={(e) =>
                        setExperienceForm({
                            ...experienceForm,
                            end_date: e.target.value,
                        })
                    }
                />


                <div className="modal-actions">

                    <button
                        type="button"
                        onClick={() =>
                            setShowExperienceForm(false)
                        }
                    >
                        Cancel
                    </button>

                    <button type="submit">
                        {editingExperience
                            ? "Update Experience"
                            : "Save Experience"}
                    </button>

                </div>

            </form>

        </div>

    </div>
)}
{showProjectForm && (
    <div className="modal-overlay">
        <div className="modal">

            <div className="modal-header">
                <h2>
                    {editingProject
                        ? "Edit Project"
                        : "Add Project"}
                </h2>

                <button
                    type="button"
                    className="modal-close"
                    onClick={() => setShowProjectForm(false)}
                >
                    ×
                </button>
            </div>

            <form onSubmit={handleSaveProject}>

                <label>Project Name</label>

                <input
                    type="text"
                    value={projectForm.project_name}
                    onChange={(e) =>
                        setProjectForm({
                            ...projectForm,
                            project_name: e.target.value,
                        })
                    }
                    required
                />

                <label>Description</label>

                <textarea
                    value={projectForm.description}
                    onChange={(e) =>
                        setProjectForm({
                            ...projectForm,
                            description: e.target.value,
                        })
                    }
                    required
                />

                <label>Start Date</label>

                <input
                    type="date"
                    value={projectForm.start_date}
                    onChange={(e) =>
                        setProjectForm({
                            ...projectForm,
                            start_date: e.target.value,
                        })
                    }
                    required
                />

                <label>End Date</label>

                <input
                    type="date"
                    value={projectForm.end_date}
                    onChange={(e) =>
                        setProjectForm({
                            ...projectForm,
                            end_date: e.target.value,
                        })
                    }
                />

                <div className="modal-actions">

                    <button
                        type="button"
                        onClick={() =>
                            setShowProjectForm(false)
                        }
                    >
                        Cancel
                    </button>

                    <button type="submit">
                        {editingProject
                            ? "Update Project"
                            : "Save Project"}
                    </button>

                </div>

            </form>
        </div>
    </div>
)}
            </main>
        </>
    );
}

export default Account;