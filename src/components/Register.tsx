import axios from "axios";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Button from "./ui/Button";
import { useNavigate } from "react-router-dom";

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullname: "",
        email: "",
        password: "",
        confirmpass: ""
    });

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (form.fullname.trim() === "") {
            alert("Please enter your name");
            return;
        }

        if (!form.email.includes("@")) {
            alert("Please enter a valid email");
            return;
        }

        if (form.password.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        if (form.password !== form.confirmpass) {
            alert("Passwords do not match");
            return;
        }


        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/register",
                {
                    full_name: form.fullname,
                    email: form.email,
                    password: form.password
                }
            );
            alert(response.data.message);
            navigate("/login");
        } catch (error: any) {
            alert(error.response?.data?.message || "Registration Failed");
        }
    }

    function handleUserInput(e: ChangeEvent<HTMLInputElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    return (
        <>
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text" id="fullname" name="fullname"
                    value={form.fullname}
                    onChange={handleUserInput}
                    autoComplete="off" placeholder="Full Name"
                    required
                />
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
                <input
                    type="password" id="confirmpass" name="confirmpass"
                    value={form.confirmpass}
                    onChange={handleUserInput}
                    autoComplete="off" placeholder="Confirm Password"
                    required
                />
                <Button type="submit">Register</Button>
            </form>
        </>
    )
}

export default Register
