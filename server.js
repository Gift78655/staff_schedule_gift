const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(
  cors({
    origin: "https://your-frontend-url.com", // Replace with your frontend URL or allow all origins in dev
  })
);

// MySQL Connection
const db = mysql.createConnection({
  host: "34.35.53.111",       // Online database host (Google Cloud SQL public IP)
  user: "app-user",           // MySQL username
  password: "mthombenigift45@", // MySQL password
  database: "healthcare_management_system", // Database name
  port: 3306,                 // MySQL port
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1); // Exit the process if the connection fails
  } else {
    console.log("✅ Connected to the MySQL database.");
  }
});

// Root route for health check
app.get("/", (req, res) => {
  res.status(200).send("Welcome to the server! Use /health for a health check.");
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Fetch schedules for calendar view
app.get("/schedules/calendar/:userId", (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT 
      schedule_id AS id, 
      role AS title, 
      CONCAT(shift_date_start, 'T', shift_start) AS start, 
      CONCAT(shift_date_end, 'T', shift_end) AS end
    FROM staff_schedules 
    WHERE user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching schedules for calendar:", err.message);
      return res.status(500).json({ message: "Error fetching calendar schedules." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No schedules found for this user." });
    }

    res.json(results);
  });
});

// Add or update a schedule
app.post("/schedules", (req, res) => {
  const {
    schedule_id,
    user_id,
    institution_id,
    shift_date_start,
    shift_date_end,
    shift_start,
    shift_end,
    role,
  } = req.body;

  if (!user_id || !institution_id || !shift_date_start || !shift_date_end || !shift_start || !shift_end || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const query = schedule_id
    ? `UPDATE staff_schedules SET 
        user_id = ?, 
        institution_id = ?, 
        shift_date_start = ?, 
        shift_date_end = ?, 
        shift_start = ?, 
        shift_end = ?, 
        role = ? 
      WHERE schedule_id = ?`
    : `INSERT INTO staff_schedules (
        schedule_id, 
        user_id, 
        institution_id, 
        shift_date_start, 
        shift_date_end, 
        shift_start, 
        shift_end, 
        role
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`;

  const params = schedule_id
    ? [
        user_id,
        institution_id,
        shift_date_start,
        shift_date_end,
        shift_start,
        shift_end,
        role,
        schedule_id,
      ]
    : [
        user_id,
        institution_id,
        shift_date_start,
        shift_date_end,
        shift_start,
        shift_end,
        role,
      ];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ Error saving schedule:", err.message);
      return res.status(500).json({ message: "Error saving schedule." });
    }
    res.json({ message: "Schedule saved successfully.", results });
  });
});

// Start the server
const PORT = process.env.PORT || 3000; // Use Render's dynamic port
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
