import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface User {
    user_id: number;
    full_name: string;
    email: string;
    github_profile_url?: string | null;
    linkedin_profile_url?: string | null;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    login: (user: User) => void;
    logout: () => void;
}

//created authcontext
const AuthContext = createContext<AuthContextType | null>(null);


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { return; }

        axios.get("http://localhost:5000/api/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((response) => {
                setUser(response.data);
            })
            .catch(() => {
                localStorage.removeItem("token");
                setUser(null);
            });
    }, []);

    const login = (user: User) => {
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: user !== null, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

//custom hook for auth
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
};