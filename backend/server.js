const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("./db.js");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// REGISTER CUSTOMER
app.post("/register/customer", (req, res) => {
  const { name, email, phone, password, preferences, role = "customer" } = req.body;

  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  const sql = `
    INSERT INTO users (name, email, phone, password, role, preferences)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, email, phone, password, role, preferences], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY")
        return res.status(400).json({ error: "Email already registered" });

      return res.status(500).json({ error: err.message });
    }

    res.json({ message: "Registered successfully", id: result.insertId });
  });
});

// REGISTER PROVIDER
app.post("/register/provider", (req, res) => {
  const { name, email, phone, password, service_type, license_info, service_area } = req.body;

  const sql = `
    INSERT INTO users (name, email, phone, password, service_type, license_info, service_area, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, "provider")
  `;

  db.query(
    sql,
    [name, email, phone, password, service_type, license_info, service_area],
    (err, result) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Provider registered successfully!", id: result.insertId });
    }
  );
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const q = "SELECT * FROM users WHERE email = ? AND password = ?";

  db.query(q, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(401).json({ error: "Invalid login" });
    res.json(results[0]);
  });
});

// RESET PASSWORD REQUEST
app.post("/api/reset-password-request", (req, res) => {
  const { email } = req.body;

  const token = crypto.randomBytes(20).toString("hex");
  const expiry = new Date(Date.now() + 15 * 60000);

  const sql = "UPDATE users SET reset_token=?, reset_token_expiry=? WHERE email=?";

  db.query(sql, [token, expiry, email], (err, result) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Email not found" });

    res.json({ message: "Password reset email sent!" });
  });
});

// RESET PASSWORD
app.post("/api/reset-password/:token", (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const sql = `
    UPDATE users 
    SET password=?, reset_token=NULL, reset_token_expiry=NULL
    WHERE reset_token=? AND reset_token_expiry > NOW()
  `;

  db.query(sql, [password, token], (err, result) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    if (result.affectedRows === 0)
      return res.status(400).json({ message: "Invalid or expired token" });

    res.json({ message: "Password updated successfully!" });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
