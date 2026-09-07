import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import "../../css/navbar.css";

function Navbar() {

    const navigate = useNavigate();
    const location = useLocation();

    const { logout } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login");
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

                <button className="nav-item active" onClick={() => navigate("/dashboard")}>
                    <span>⌂</span>Dashboard
                </button>

                <button className="nav-item" onClick={() => navigate("/careers")}>
                    <span>◆</span>Careers
                </button>

                <button className="nav-item" onClick={() => navigate("/progress")}>
                    <span>▣</span>My Progress
                </button>



                <p className="nav-title second">
                    ACCOUNT
                </p>

                <button className="nav-item" onClick={() => navigate("/account")}>
                    <span>●</span>Profile
                </button>
            </nav>

            <div className="sidebar-bottom">
                <button className="nav-item logout-button" onClick={handleLogout}>
                    <span>↪</span>Logout
                </button>
            </div>
        </aside>
    );
}

export default Navbar;