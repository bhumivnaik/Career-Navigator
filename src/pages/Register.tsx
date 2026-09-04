import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Register.css'

function Register() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    setMessage('')
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const response = await fetch(
        'http://localhost:3000/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName,
            email,
            password,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Registration failed')
        return
      }

      setMessage('Account created successfully! Redirecting...')

      setTimeout(() => {
        navigate('/login')
      }, 1200)
    } catch {
      setError('Unable to connect to the server')
    }
  }

  return (
    <div className="register-page">

      {/* Left Section */}
      <div className="register-brand">
        <div className="brand-content">

          <div className="brand-logo">
            <div className="logo-icon">CN</div>
            <span>Career Navigator</span>
          </div>

          <div className="brand-message">
            <p className="brand-small-title">
              YOUR CAREER. YOUR PATH.
            </p>

            <h1>
              Build your future
              <br />
              with confidence.
            </h1>

            <p className="brand-description">
              Discover career opportunities, identify your skill gaps,
              and follow a personalized path toward your dream career.
            </p>
          </div>

          <div className="brand-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Discover career paths</span>
            </div>

            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Track your skills</span>
            </div>

            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Build your career roadmap</span>
            </div>
          </div>

        </div>
      </div>

      {/* Right Section */}
      <div className="register-section">

        <div className="register-card">

          <div className="register-header">
            <h2>Create your account</h2>

            <p>
              Start building your personalized career journey.
            </p>
          </div>

          <form onSubmit={handleRegister}>

            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="message error-message">
                {error}
              </div>
            )}

            {message && (
              <div className="message success-message">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="register-button"
            >
              Create Account
            </button>

          </form>

          <div className="login-link">
            Already have an account?
            <Link to="/login">Sign in</Link>
          </div>

        </div>

      </div>

    </div>
  )
}

export default Register