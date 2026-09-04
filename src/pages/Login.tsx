import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    setError('')

    try {
      const response = await fetch(
        'http://localhost:3000/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Invalid email or password')
        return
      }

      // Store login information
      localStorage.setItem(
        'access_token',
        data.access_token,
      )

      localStorage.setItem(
        'user',
        JSON.stringify(data.user),
      )

      navigate('/profile')
    } catch {
      setError('Unable to connect to the server')
    }
  }

  return (
    <div className="login-page">

      {/* Left Section */}
      <div className="login-brand">

        <div className="brand-content">

          <div className="brand-logo">
            <div className="logo-icon">
              CN
            </div>

            <span>
              Career Navigator
            </span>
          </div>

          <div className="brand-message">

            <p className="brand-small-title">
              WELCOME BACK
            </p>

            <h1>
              Your career
              <br />
              journey continues.
            </h1>

            <p className="brand-description">
              Continue exploring career paths, track your
              skills, identify gaps, and move closer to
              your career goals.
            </p>

          </div>

          <div className="brand-features">

            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Explore career opportunities</span>
            </div>

            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Track your skill progress</span>
            </div>

            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Follow your personalized roadmap</span>
            </div>

          </div>

        </div>

      </div>

      {/* Right Section */}
      <div className="login-section">

        <div className="login-card">

          <div className="login-header">

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to continue your career journey.
            </p>

          </div>

          <form onSubmit={handleLogin}>

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
                onChange={(e) =>
                  setEmail(e.target.value)
                }
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

            </div>

            {/* Error */}
            {error && (
              <div className="message error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
            >
              Sign In
            </button>

          </form>

          <div className="register-link">

            Don't have an account?

            <Link to="/register">
              Create an account
            </Link>

          </div>

        </div>

      </div>

    </div>
  )
}

export default Login