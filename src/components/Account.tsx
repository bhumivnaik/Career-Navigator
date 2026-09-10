import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/authContext";
import Navbar from "../components/ui/Navbar";
import "../css/account.css";

type GithubData = {
    github_username: string;
    repository_count: number;
    detected_languages: string[];
    detected_technologies: string[];
    synced_at: string;
};

type Education = {
    education_id: number;
    degree: string;
    field_of_study: string;
    institution: string;
    start_year: number;
    end_year: number;
    skill_ids?: number[];
};

type Course = {
    course_id: number;
    course_name: string;
    provider: string;
    description: string;
    completion_date: string;
    certificate_url?: string;
    skill_ids?: number[];
};

type Experience = {
    experience_id: number;
    experience_type: string;
    job_title: string;
    company_name: string;
    description: string;
    start_date: string;
    end_date?: string;
    skill_ids?: number[];
};

type Project = {
    project_id: number;
    project_name: string;
    description: string;
    start_date: string;
    end_date?: string;
    skill_ids?: number[];
};
type Skill = {
    skill_id: number;
    skill_name: string;
    category: string;
};

function Account() {


    const { user, login } = useAuth();
    const location = useLocation();

    const navigate = useNavigate();

    const [githubData, setGithubData] = useState<GithubData | null>(null);
    const [githubSyncing, setGithubSyncing] = useState(false);
    const [education, setEducation] = useState<Education[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [experience, setExperience] = useState<Experience[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);

    const [loading, setLoading] = useState(true);
    const [showProfileForm, setShowProfileForm] = useState(false);

    const [profileForm, setProfileForm] = useState({
        full_name: "",
        github_profile_url: "",
        linkedin_profile_url: "",
        about: "",
    });
    const [showEducationForm, setShowEducationForm] = useState(false);
    const [editingEducation, setEditingEducation] = useState<Education | null>(null);

    const [educationForm, setEducationForm] = useState({
    degree: "",
    field_of_study: "",
    institution: "",
    start_year: "",
    end_year: "",
    skill_ids: [] as number[],
});

    const [showCourseForm, setShowCourseForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const [courseForm, setCourseForm] = useState({
    course_name: "",
    provider: "",
    description: "",
    completion_date: "",
    certificate_url: "",
    skill_ids: [] as number[],
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
    skill_ids: [] as number[],
});
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const [projectForm, setProjectForm] = useState({
    project_name: "",
    description: "",
    start_date: "",
    end_date: "",
    skill_ids: [] as number[],
});

    const token = localStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`
    };

    useEffect(() => {

        loadAccountData();

    }, []);

    const handleGithubSync = async () => {

        try {

            setGithubSyncing(true);

            const token =
                localStorage.getItem("token");


            const response = await axios.post(
                "http://localhost:5000/api/github/sync",
                {},
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            console.log("GITHUB SYNC RESPONSE:", response.data);
            setGithubData({
                github_username:
                    response.data.github_username,

                repository_count:
                    response.data.repositories,

                detected_languages:
                    response.data.detected_languages,

                detected_technologies:
                    response.data.detected_technologies,

                synced_at:
                    new Date().toISOString()
            });


            await loadAccountData();

        } catch (error: any) {

            console.error(
                "GitHub sync error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to synchronize GitHub"
            );

        } finally {

            setGithubSyncing(false);
        }
    };

    const loadAccountData = async () => {
        try {

            const [
    educationResponse,
    coursesResponse,
    experienceResponse,
    projectsResponse,
    skillsResponse
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
                ),

                axios.get(
    "http://localhost:5000/api/skills",
    { headers }
)

            ]);

            setEducation(educationResponse.data);
            setCourses(coursesResponse.data);
            setExperience(experienceResponse.data);
            setProjects(projectsResponse.data);
            setSkills(skillsResponse.data);

            const githubResponse = await axios.get(
                "http://localhost:5000/api/github/sync",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setGithubData(githubResponse.data);
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
    skill_ids: [],
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
            skill_ids: item.skill_ids || [],
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
                skill_ids: educationForm.skill_ids,
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
    skill_ids: [],
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
            skill_ids: item.skill_ids || [],
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
                skill_ids: courseForm.skill_ids,
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
    skill_ids: [],
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
            skill_ids: item.skill_ids || [],
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
                skill_ids: experienceForm.skill_ids,
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
    skill_ids: [],
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
            skill_ids: item.skill_ids || [],
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
                skill_ids: projectForm.skill_ids,
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

    const handleEditProfile = () => {
        setProfileForm({
            full_name: user?.full_name || "",
            github_profile_url: user?.github_profile_url || "",
            linkedin_profile_url: user?.linkedin_profile_url || "",
            about: user?.about || "",
        });

        setShowProfileForm(true);
    };
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await axios.put(
                "http://localhost:5000/api/profile/",
                {
                    full_name: profileForm.full_name,
                    github_profile_url: profileForm.github_profile_url,
                    linkedin_profile_url: profileForm.linkedin_profile_url,
                    about: profileForm.about,
                },
                { headers }
            );

            setShowProfileForm(false);

            // Refresh so the updated profile information is displayed
            window.location.reload();

        } catch (error: any) {
            console.error("PROFILE UPDATE ERROR:", error);
            console.error("SERVER RESPONSE:", error.response?.data);
        }
    };
    const toggleSkill = (
    skillId: number,
    selectedSkills: number[],
    setSelectedSkills: (skills: number[]) => void
) => {
    if (selectedSkills.includes(skillId)) {
        setSelectedSkills(
            selectedSkills.filter(id => id !== skillId)
        );
    } else {
        setSelectedSkills([
            ...selectedSkills,
            skillId
        ]);
    }
};
const renderSkillSelector = (
    selectedSkills: number[],
    setSelectedSkills: (skills: number[]) => void,
    title: string,
    description: string
) => (
    <div className="skill-selector">

        <label>{title}</label>

        <p className="skill-selector-description">
            {description}
        </p>

        <div className="skill-checkbox-list">

            {skills.map((skill) => (

                <label
                    key={skill.skill_id}
                    className="skill-checkbox"
                >

                    <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill.skill_id)}
                        onChange={() =>
                            toggleSkill(
                                skill.skill_id,
                                selectedSkills,
                                setSelectedSkills
                            )
                        }
                    />

                    <span>{skill.skill_name}</span>

                </label>

            ))}

        </div>

    </div>
);
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
                                    <button
                                        type="button"
                                        className="profile-edit-button"
                                        onClick={handleEditProfile}
                                    >
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

                <section className="github-section">
                    {!githubData ? (

                        <div className="github-empty">

                            <div className="github-empty-icon">
                                ◉
                            </div>

                            <div>
                                <h3>Connect your GitHub activity</h3>

                                <p>
                                    Sync your repositories to automatically
                                    detect the technologies you use.
                                </p>
                            </div>

                            {user?.github_profile_url && (
                                <button
                                    className="github-sync-main-button"
                                    onClick={handleGithubSync}
                                    disabled={githubSyncing}
                                >
                                    {githubSyncing
                                        ? "Syncing..."
                                        : "Sync GitHub"}
                                </button>
                            )}

                        </div>

                    ) : (

                        <div className="github-analysis">


                            {/* GitHub overview */}

                            <div className="github-overview">

                                <div className="github-profile">

                                    <div className="github-avatar">
                                        ◉
                                    </div>

                                    <div>
                                        <span>GITHUB PROFILE</span>

                                        <h3>
                                            @{githubData.github_username}
                                        </h3>

                                        <a
                                            href={user?.github_profile_url || "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View GitHub Profile ↗
                                        </a>
                                    </div>

                                </div>


                                <div className="github-stat">

                                    <strong>
                                        {githubData.repository_count}
                                    </strong>

                                    <span>
                                        Repositories
                                    </span>

                                </div>


                                <button
                                    className="github-sync-main-button"
                                    onClick={handleGithubSync}
                                    disabled={githubSyncing}
                                >
                                    {githubSyncing
                                        ? "Syncing..."
                                        : "Sync GitHub"}
                                </button>

                            </div>


                            {/* Extracted Skills */}

                            <div className="github-result-block">

                                <div className="github-result-title">

                                    <div>
                                        <h3>Extracted Skills</h3>
                                    </div>
                                    <span>
                                        {
                                            [
                                                ...githubData.detected_languages,
                                                ...githubData.detected_technologies
                                            ].filter(
                                                (skill, index, array) =>
                                                    array.indexOf(skill) === index
                                            ).length
                                        }
                                    </span>

                                </div>
                                {[
                                    ...githubData.detected_languages,
                                    ...githubData.detected_technologies
                                ].filter(
                                    (skill, index, array) =>
                                        array.indexOf(skill) === index
                                ).length > 0 ? (

                                    <div className="github-tags">

                                        {[
                                            ...githubData.detected_languages,
                                            ...githubData.detected_technologies
                                        ]
                                            .filter(
                                                (skill, index, array) =>
                                                    array.indexOf(skill) === index
                                            )
                                            .map((skill) => (

                                                <span
                                                    className="github-tag technology-tag"
                                                    key={skill}
                                                >
                                                    {skill}
                                                </span>

                                            ))}

                                    </div>

                                ) : (

                                    <p className="github-no-data">
                                        No skills detected from GitHub.
                                    </p>

                                )}

                            </div>


                            <div className="github-last-sync">

                                Last synchronized:{" "}

                                {new Date(
                                    githubData.synced_at
                                ).toLocaleString()}

                            </div>

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
                    </div>

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
                    {showProfileForm && (
                        <div className="modal-overlay">
                            <div className="modal">

                                <div className="modal-header">
                                    <h2>Edit Profile</h2>

                                    <button
                                        type="button"
                                        className="modal-close"
                                        onClick={() => setShowProfileForm(false)}
                                    >
                                        ×
                                    </button>
                                </div>

                                <form onSubmit={handleSaveProfile}>

                                    <label>Full Name</label>

                                    <input
                                        type="text"
                                        value={profileForm.full_name}
                                        onChange={(e) =>
                                            setProfileForm({
                                                ...profileForm,
                                                full_name: e.target.value,
                                            })
                                        }
                                        required
                                    />

                                    <label>GitHub Profile URL</label>

                                    <input
                                        type="url"
                                        value={profileForm.github_profile_url}
                                        onChange={(e) =>
                                            setProfileForm({
                                                ...profileForm,
                                                github_profile_url: e.target.value,
                                            })
                                        }
                                        placeholder="https://github.com/username"
                                    />

                                    <label>LinkedIn Profile URL</label>

                                    <input
                                        type="url"
                                        value={profileForm.linkedin_profile_url}
                                        onChange={(e) =>
                                            setProfileForm({
                                                ...profileForm,
                                                linkedin_profile_url: e.target.value,
                                            })
                                        }
                                        placeholder="https://linkedin.com/in/username"
                                    />

                                    <label>About</label>

                                    <textarea
                                        value={profileForm.about}
                                        onChange={(e) =>
                                            setProfileForm({
                                                ...profileForm,
                                                about: e.target.value,
                                            })
                                        }
                                        rows={4}
                                        placeholder="Tell us about yourself..."
                                    />

                                    <div className="modal-actions">

                                        <button
                                            type="button"
                                            onClick={() => setShowProfileForm(false)}
                                        >
                                            Cancel
                                        </button>

                                        <button type="submit">
                                            Save Profile
                                        </button>

                                    </div>

                                </form>

                            </div>
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
                                {renderSkillSelector(
    educationForm.skill_ids,
    (selectedSkills) =>
        setEducationForm({
            ...educationForm,
            skill_ids: selectedSkills,
        }),
    "Skills Learned",
    "Select the skills you learned during this education."
)}

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
                                {renderSkillSelector(
    courseForm.skill_ids,
    (selectedSkills) =>
        setCourseForm({
            ...courseForm,
            skill_ids: selectedSkills,
        }),
    "Skills Learned",
    "Select the skills you learned from this course."
)}


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
                                {renderSkillSelector(
    experienceForm.skill_ids,
    (selectedSkills) =>
        setExperienceForm({
            ...experienceForm,
            skill_ids: selectedSkills,
        }),
    "Skills Gained",
    "Select the skills you gained or used during this experience."
)}


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
                                {renderSkillSelector(
    projectForm.skill_ids,
    (selectedSkills) =>
        setProjectForm({
            ...projectForm,
            skill_ids: selectedSkills,
        }),
    "Skills Used / Demonstrated",
    "Select the skills you used or demonstrated while working on this project."
)}

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