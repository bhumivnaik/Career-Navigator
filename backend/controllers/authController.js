const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//register api
const register = async (req, res) => {
    const { full_name, email, password } = req.body;

    const getsql = "select * from users where email = ?";
    db.query(getsql, [email], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        if (result.length > 0) {
            return res.status(400).json({ message: "Email already registered" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertsql = `insert into users (full_name, email, password_hash) values (?, ?, ?)`;
        db.query(insertsql, [full_name, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to register the user" });
            }

            res.status(201).json({ message: "User registered successfully" });
        })
    });
};


//login api
const login = async (req, res) => {
    const { email, password } = req.body;

    const getsql = "select * from users where email = ?";

    db.query(getsql, [email], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        if (result.length === 0) {
            return res.status(401).json({ message: "Invalid Email" });
        }

        const user = result[0];
        const matchPassword = await bcrypt.compare(password, user.password_hash);
        if (!matchPassword) {
            return res.status(401).json({
                message: "Invalid Password"
            });
        }

        const token = jwt.sign(
            { user_id: user.user_id }, process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ message: "Login Successful", token: token });
    });
}


//to remember across pages
const me = async (req, res) => {
    const userId = req.user.user_id;

    const getsql = `select user_id, full_name, email, github_profile_url from users where user_id= ?`;

    db.query(getsql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        if (result.length === 0) {
            return res.status(401).json({ message: "User not found" });
        }

        res.json(result[0]);
    });
}

module.exports = { register, login, me }

