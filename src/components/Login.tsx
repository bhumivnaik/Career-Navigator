import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState, type FormEvent, type ChangeEvent } from "react";
import Button from "./ui/Button";
import { useAuth } from "../context/authContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                {
                    email: form.email,
                    password: form.password
                }
            );

            localStorage.setItem("token", response.data.token);
            const userResponse = await axios.get(
                "http://localhost:5000/api/auth/me",
                {
                    headers: {
                        Authorization: `Bearer ${response.data.token}`
                    }
                }
            );
            login(userResponse.data);

            alert(response.data.message);
            navigate("/");
        } catch (error: any) {
            alert(error.response?.data?.message || "Login Failed");
        }
    }

    function handleUserInput(e: ChangeEvent<HTMLInputElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    return (
        <>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="email" id="email" name="email"
                    value={form.email}
                    onChange={handleUserInput}
                    autoComplete="off" placeholder="Email"
                    required
                />
                <input
                    type="password" id="password" name="password"
                    value={form.password}
                    onChange={handleUserInput}
                    autoComplete="off" placeholder="Password"
                    required
                />

                <Button type="submit">Login</Button>
            </form>
        </>
    )
}

export default Login
