import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import "../../css/navbar.css";

function Navbar() {

    const navigate = useNavigate();
    const location = useLocation();

    const { logout } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <aside className="sidebar">

            <div className="sidebar-logo">
                <div className="logo-icon">CN</div>
                <div>
                    <h2>Career</h2>
                    <span>Navigator</span>
                </div>
            </div>

            <nav className="sidebar-nav">

                <p className="nav-title">MENU</p>

                {/* Dashboard */}
                <button
                    className={`nav-item ${
                        location.pathname === "/dashboard"
                            ? "active"
                            : ""
                    }`}
                    onClick={() => navigate("/dashboard")}
                >
                    <span>⌂</span>
                    Dashboard
                </button>

                {/* Careers */}
                <button
                    className={`nav-item ${
                        location.pathname === "/careers" ||
                        location.pathname.startsWith("/careers/")
                            ? "active"
                            : ""
                    }`}
                    onClick={() => navigate("/careers")}
                >
                    <span>◆</span>
                    Careers
                </button>

                {/* My Progress */}
                <button
                    className={`nav-item ${
                        location.pathname === "/progress"
                            ? "active"
                            : ""
                    }`}
                    onClick={() => navigate("/progress")}
                >
                    <span>▣</span>
                    My Progress
                </button>

                {/* Skill Quiz */}
                <button
                    className={`nav-item ${
                        location.pathname === "/quiz"
                            ? "active"
                            : ""
                    }`}
                    onClick={() => navigate("/quiz")}
                >
                    <span>✓</span>
                    Skill Quiz
                </button>

                <p className="nav-title second">
                    ACCOUNT
                </p>

                {/* Profile */}
                <button
                    className={`nav-item ${
                        location.pathname === "/account"
                            ? "active"
                            : ""
                    }`}
                    onClick={() => navigate("/account")}
                >
                    <span>●</span>
                    Profile
                </button>

            </nav>

            <div className="sidebar-bottom">

                <button
                    className="nav-item logout-button"
                    onClick={handleLogout}
                >
                    <span>↪</span>
                    Logout
                </button>

            </div>

        </aside>
    );
}

export default Navbar;