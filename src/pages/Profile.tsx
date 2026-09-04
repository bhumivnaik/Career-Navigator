import { useEffect, useState } from 'react'
import './Profile.css'

function Profile() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
    useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        return
      }

      try {
        const response = await fetch(
          'http://localhost:3000/profile',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (!response.ok) {
          return
        }

        const data = await response.json()

        if (data.profile) {
          setName(data.profile.full_name || '')
          setEmail(data.profile.email || '')
        }
      } catch (error) {
        console.error('Unable to load profile:', error)
      }
    }

    loadProfile()
  }, [])
  const [degree, setDegree] = useState('')
const [fieldOfStudy, setFieldOfStudy] = useState('')
const [institution, setInstitution] = useState('')
const [startYear, setStartYear] = useState('')
const [endYear, setEndYear] = useState('')

const [interests, setInterests] = useState('')
  const [skillName, setSkillName] = useState('')
  const [skillLevel, setSkillLevel] = useState('')

  const [skills, setSkills] = useState<
    { name: string; level: string }[]
  >([])

  const [certifications, setCertifications] = useState<
    { name: string; organization: string; date: string }[]
  >([])

  const [certName, setCertName] = useState('')
  const [certOrganization, setCertOrganization] = useState('')
  const [certDate, setCertDate] = useState('')

  const [projects, setProjects] = useState<
    { name: string; description: string; technologies: string }[]
  >([])

  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectTechnologies, setProjectTechnologies] = useState('')

  const [experiences, setExperiences] = useState<
    {
      title: string
      organization: string
      duration: string
      description: string
    }[]
  >([])

  const [experienceTitle, setExperienceTitle] = useState('')
  const [experienceOrganization, setExperienceOrganization] = useState('')
  const [experienceDuration, setExperienceDuration] = useState('')
  const [experienceDescription, setExperienceDescription] = useState('')

  const [courses, setCourses] = useState<
    { name: string; platform: string; date: string }[]
  >([])

  const [courseName, setCourseName] = useState('')
  const [coursePlatform, setCoursePlatform] = useState('')
  const [courseDate, setCourseDate] = useState('')

  const [currentlyLearning, setCurrentlyLearning] = useState('')
  const [learningMethod, setLearningMethod] = useState('')

  const [message, setMessage] = useState('')

  const addSkill = () => {
    if (!skillName || !skillLevel) return

    setSkills([
      ...skills,
      {
        name: skillName,
        level: skillLevel,
      },
    ])

    setSkillName('')
    setSkillLevel('')
  }

  const addCertification = () => {
    if (!certName) return

    setCertifications([
      ...certifications,
      {
        name: certName,
        organization: certOrganization,
        date: certDate,
      },
    ])

    setCertName('')
    setCertOrganization('')
    setCertDate('')
  }

  const addProject = () => {
    if (!projectName) return

    setProjects([
      ...projects,
      {
        name: projectName,
        description: projectDescription,
        technologies: projectTechnologies,
      },
    ])

    setProjectName('')
    setProjectDescription('')
    setProjectTechnologies('')
  }

  const addExperience = () => {
    if (!experienceTitle) return

    setExperiences([
      ...experiences,
      {
        title: experienceTitle,
        organization: experienceOrganization,
        duration: experienceDuration,
        description: experienceDescription,
      },
    ])

    setExperienceTitle('')
    setExperienceOrganization('')
    setExperienceDuration('')
    setExperienceDescription('')
  }

  const addCourse = () => {
    if (!courseName) return

    setCourses([
      ...courses,
      {
        name: courseName,
        platform: coursePlatform,
        date: courseDate,
      },
    ])

    setCourseName('')
    setCoursePlatform('')
    setCourseDate('')
  }

  const handleSave = async () => {
    setMessage('')

    const profile = {
      personalInformation: {
  name,
  email,
  education: {
    degree,
    fieldOfStudy,
    institution,
    startYear,
    endYear,
  },
  interests,
},
      skills,
      certifications,
      projects,
      experiences,
      courses,
      learningHistory: {
        currentlyLearning,
        learningMethod,
      },
    }

    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch(
        'http://localhost:3000/profile',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profile),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || 'Unable to save profile')
        return
      }

      setMessage('Profile saved successfully!')
    } catch {
      setMessage('Unable to connect to the server')
    }
  }

  return (
    <div className="profile-page">

      {/* Header */}
      <header className="profile-header">

        <div className="profile-brand">
          <div className="profile-logo">
            CN
          </div>

          <div>
            <h1>Career Navigator</h1>
            <span>Build your career profile</span>
          </div>
        </div>

        <div className="profile-header-right">
          <span className="profile-status">
            Profile Setup
          </span>

          <div className="user-circle">
            {name
              ? name.charAt(0).toUpperCase()
              : 'U'}
          </div>
        </div>

      </header>


      {/* Main */}
      <main className="profile-container">

        <div className="profile-intro">

          <div>
            <p className="section-label">
              YOUR PROFILE
            </p>

            <h2>
              Tell us about yourself
            </h2>

            <p>
              Add your education, skills, projects and
              experience to build your career profile.
            </p>
          </div>

        </div>


        {/* Personal Information */}
        <section className="profile-card">

          <div className="card-heading">
            <div className="card-number">
              01
            </div>

            <div>
              <h3>Personal Information</h3>
              <p>Basic information about you</p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            <div className="form-group">
  <label>Degree</label>

  <input
    type="text"
    placeholder="e.g. B.E."
    value={degree}
    onChange={(e) =>
      setDegree(e.target.value)
    }
  />
</div>

<div className="form-group">
  <label>Field of Study</label>

  <input
    type="text"
    placeholder="e.g. Computer Engineering"
    value={fieldOfStudy}
    onChange={(e) =>
      setFieldOfStudy(e.target.value)
    }
  />
</div>

<div className="form-group">
  <label>Institution</label>

  <input
    type="text"
    placeholder="e.g. Goa Engineering College"
    value={institution}
    onChange={(e) =>
      setInstitution(e.target.value)
    }
  />
</div>

<div className="form-group">
  <label>Start Year</label>

  <input
    type="number"
    placeholder="e.g. 2023"
    min="1900"
    max="2100"
    value={startYear}
    onChange={(e) =>
      setStartYear(e.target.value)
    }
  />
</div>

<div className="form-group">
  <label>End Year</label>

  <input
    type="number"
    placeholder="e.g. 2027"
    min="1900"
    max="2100"
    value={endYear}
    onChange={(e) =>
      setEndYear(e.target.value)
    }
  />
</div>

            <div className="form-group">
              <label>Areas of Interest</label>

              <input
                type="text"
                placeholder="e.g. Web Development, AI"
                value={interests}
                onChange={(e) =>
                  setInterests(e.target.value)
                }
              />
            </div>

          </div>

        </section>


        {/* Skills */}
        <section className="profile-card">

          <div className="card-heading">
            <div className="card-number">
              02
            </div>

            <div>
              <h3>Skills</h3>
              <p>Add the skills you currently have</p>
            </div>
          </div>

          <div className="add-row">

            <input
              type="text"
              placeholder="Skill name"
              value={skillName}
              onChange={(e) =>
                setSkillName(e.target.value)
              }
            />

            <select
              value={skillLevel}
              onChange={(e) =>
                setSkillLevel(e.target.value)
              }
            >
              <option value="">
                Select level
              </option>

              <option value="Beginner">
                Beginner
              </option>

              <option value="Intermediate">
                Intermediate
              </option>

              <option value="Advanced">
                Advanced
              </option>
            </select>

            <button
              type="button"
              className="add-button"
              onClick={addSkill}
            >
              + Add Skill
            </button>

          </div>

          {skills.length > 0 && (
            <div className="item-list">

              {skills.map((skill, index) => (
                <div
                  className="skill-item"
                  key={index}
                >
                  <span>
                    {skill.name}
                  </span>

                  <span className="level-badge">
                    {skill.level}
                  </span>
                </div>
              ))}

            </div>
          )}

        </section>


        {/* Certifications */}
        <section className="profile-card">

          <div className="card-heading">
            <div className="card-number">
              03
            </div>

            <div>
              <h3>Certifications</h3>
              <p>Highlight your professional certifications</p>
            </div>
          </div>

          <div className="form-grid three">

            <div className="form-group">
              <label>Certification Name</label>

              <input
                type="text"
                placeholder="e.g. AWS Cloud Practitioner"
                value={certName}
                onChange={(e) =>
                  setCertName(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Organization</label>

              <input
                type="text"
                placeholder="e.g. Amazon Web Services"
                value={certOrganization}
                onChange={(e) =>
                  setCertOrganization(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Completion Date</label>

              <input
                type="date"
                value={certDate}
                onChange={(e) =>
                  setCertDate(e.target.value)
                }
              />
            </div>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={addCertification}
          >
            + Add Certification
          </button>

          {certifications.length > 0 && (
            <div className="item-list">

              {certifications.map((cert, index) => (
                <div
                  className="list-card"
                  key={index}
                >
                  <strong>{cert.name}</strong>

                  <span>
                    {cert.organization}
                    {cert.date &&
                      ` • ${cert.date}`}
                  </span>
                </div>
              ))}

            </div>
          )}

        </section>


        {/* Projects */}
        <section className="profile-card">

          <div className="card-heading">
            <div className="card-number">
              04
            </div>

            <div>
              <h3>Projects</h3>
              <p>Showcase projects you have worked on</p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>Project Name</label>

              <input
                type="text"
                placeholder="e.g. Career Navigator"
                value={projectName}
                onChange={(e) =>
                  setProjectName(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Technologies Used</label>

              <input
                type="text"
                placeholder="e.g. React, Node.js, MySQL"
                value={projectTechnologies}
                onChange={(e) =>
                  setProjectTechnologies(e.target.value)
                }
              />
            </div>

          </div>

          <div className="form-group">

            <label>Project Description</label>

            <textarea
              placeholder="Describe what you built and your contribution..."
              value={projectDescription}
              onChange={(e) =>
                setProjectDescription(e.target.value)
              }
            />

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={addProject}
          >
            + Add Project
          </button>

          {projects.length > 0 && (
            <div className="item-list">

              {projects.map((project, index) => (
                <div
                  className="list-card"
                  key={index}
                >
                  <strong>
                    {project.name}
                  </strong>

                  <span>
                    {project.technologies}
                  </span>

                  <p>
                    {project.description}
                  </p>
                </div>
              ))}

            </div>
          )}

        </section>


        {/* Experience */}
        <section className="profile-card">

          <div className="card-heading">
            <div className="card-number">
              05
            </div>

            <div>
              <h3>Work & Internship Experience</h3>
              <p>Add your practical experience</p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>Job / Internship Title</label>

              <input
                type="text"
                placeholder="e.g. Software Developer Intern"
                value={experienceTitle}
                onChange={(e) =>
                  setExperienceTitle(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Organization</label>

              <input
                type="text"
                placeholder="Company or organization"
                value={experienceOrganization}
                onChange={(e) =>
                  setExperienceOrganization(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Duration</label>

              <input
                type="text"
                placeholder="e.g. June 2026 - August 2026"
                value={experienceDuration}
                onChange={(e) =>
                  setExperienceDuration(e.target.value)
                }
              />
            </div>

          </div>

          <div className="form-group">

            <label>Description</label>

            <textarea
              placeholder="Describe your responsibilities and experience..."
              value={experienceDescription}
              onChange={(e) =>
                setExperienceDescription(e.target.value)
              }
            />

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={addExperience}
          >
            + Add Experience
          </button>

          {experiences.length > 0 && (
            <div className="item-list">

              {experiences.map((experience, index) => (
                <div
                  className="list-card"
                  key={index}
                >
                  <strong>
                    {experience.title}
                  </strong>

                  <span>
                    {experience.organization}
                    {' • '}
                    {experience.duration}
                  </span>

                  <p>
                    {experience.description}
                  </p>
                </div>
              ))}

            </div>
          )}

        </section>


        {/* Courses */}
        <section className="profile-card">

          <div className="card-heading">
            <div className="card-number">
              06
            </div>

            <div>
              <h3>Completed Courses</h3>
              <p>Record courses you have completed</p>
            </div>
          </div>

          <div className="form-grid three">

            <div className="form-group">
              <label>Course Name</label>

              <input
                type="text"
                placeholder="e.g. React Development"
                value={courseName}
                onChange={(e) =>
                  setCourseName(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Platform / Institution</label>

              <input
                type="text"
                placeholder="e.g. Coursera"
                value={coursePlatform}
                onChange={(e) =>
                  setCoursePlatform(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Completion Date</label>

              <input
                type="date"
                value={courseDate}
                onChange={(e) =>
                  setCourseDate(e.target.value)
                }
              />
            </div>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={addCourse}
          >
            + Add Course
          </button>

          {courses.length > 0 && (
            <div className="item-list">

              {courses.map((course, index) => (
                <div
                  className="list-card"
                  key={index}
                >
                  <strong>
                    {course.name}
                  </strong>

                  <span>
                    {course.platform}
                    {course.date &&
                      ` • ${course.date}`}
                  </span>
                </div>
              ))}

            </div>
          )}

        </section>


        {/* Learning History */}
        <section className="profile-card">

          <div className="card-heading">
            <div className="card-number">
              07
            </div>

            <div>
              <h3>Learning History</h3>
              <p>Tell us what you are currently learning</p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>Currently Learning</label>

              <input
                type="text"
                placeholder="e.g. Machine Learning"
                value={currentlyLearning}
                onChange={(e) =>
                  setCurrentlyLearning(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Learning Method</label>

              <input
                type="text"
                placeholder="e.g. Online courses, Projects"
                value={learningMethod}
                onChange={(e) =>
                  setLearningMethod(e.target.value)
                }
              />
            </div>

          </div>

        </section>


        {/* Profile Summary */}
        <section className="profile-summary">

          <div>
            <p className="section-label">
              PROFILE SUMMARY
            </p>

            <h3>
              Your career profile
            </h3>

            <p>
              {name
                ? `${name}'s profile is being built from the information provided above.`
                : 'Complete the sections above to build your career profile.'}
            </p>
          </div>

          <div className="summary-stats">

            <div>
              <strong>{skills.length}</strong>
              <span>Skills</span>
            </div>

            <div>
              <strong>{projects.length}</strong>
              <span>Projects</span>
            </div>

            <div>
              <strong>{certifications.length}</strong>
              <span>Certifications</span>
            </div>

            <div>
              <strong>{courses.length}</strong>
              <span>Courses</span>
            </div>

          </div>

        </section>


        {/* Save */}
        <div className="profile-save">

          {message && (
            <div className="save-message">
              {message}
            </div>
          )}

          <button
            className="save-button"
            onClick={handleSave}
          >
            Save Profile
            <span>→</span>
          </button>

        </div>

      </main>

    </div>
  )
}

export default Profile