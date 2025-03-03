import express from "express";
import pg from "pg";
import session from "express-session";


const app = express();
const port = 3000;

const pool = new pg.Pool({
    user: "palak",
    host: "localhost",
    database: "incident_report_db",
    password: "Palak@2004",
    port: 5432,
});

// Session setup
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to true if using https in production
}));

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// Home route (login page)
app.get("/", (req, res) => {
    res.render("index.ejs");
});

// Login route (authenticate user and store user_id in session)
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log("Received credentials:", username, password); // Debug input

        const query = "SELECT * FROM users WHERE username = $1 AND password = $2";
        const result = await pool.query(query, [username, password]);

        console.log("Query result:", result.rows); // Debug query output

        if (result.rows.length === 0) {
            // Render the login page with an error message
            return res.render("home", {
                errorMessage: "Invalid username or password",
                username, // Pass the username to preserve it in the input field
            });
        }

        const user = result.rows[0];

        // Store user_id in session
        req.session.user_id = user.id; // Store the user id in session

        if (user.username === "admin") {
            return res.redirect("dashboard");
        } else {
            return res.redirect("/home"); // Redirect to report form page
        }
    } catch (err) {
        console.error("Error during login:", err); // Debug server error
        res.status(500).send("Internal Server Error");
    }
});


// Report page (display report form with user_id from session)
app.get("/report", (req, res) => {
    if (!req.session.user_id) {
        return res.redirect("/"); // Redirect to login page if user is not logged in
    }

    // Pass user_id to the EJS template
    res.render("report.ejs", { user_id: req.session.user_id });
});

// Submit report (save report with user_id from session)
app.post("/submit-report", async (req, res) => {
    const { user_id, title, description, date, incident_type } = req.body; // Extract data from the form

    try {
        // Insert the report data into the reports table, associating with the user_id and incident_type
        const query = `
            INSERT INTO reports (user_id, title, description, date, incident_type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING report_id, created_at;
        `;
        const result = await pool.query(query, [user_id, title, description, date, incident_type]);

        // If report is successfully added, redirect to a page showing the report
        res.redirect("/track-report");  // Redirect user to their dashboard or a confirmation page
    } catch (err) {
        console.error("Error submitting report:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Track Reports Route
app.get('/track-report', async (req, res) => {
    if (!req.session.user_id) {
        return res.redirect("/"); // Redirect to login page if user is not logged in
    }
    try {
        const userId = req.session.user_id; // Replace with session retrieval logic
        const { report_id } = req.query;

        let searchedReport = null;
        let message = null;

        // Validate report_id if provided
        if (report_id) {
            if (!/^[1-9]\d*$/.test(report_id)) { // Check if report_id is a natural number
                message = "Enter a valid report ID.";
            } else {
                // Fetch the specific report
                const result = await pool.query(
                    'SELECT * FROM reports WHERE report_id = $1 AND user_id = $2',
                    [report_id, userId]
                );
                if (result.rows.length > 0) {
                    searchedReport = result.rows[0];
                } else {
                    message = `No report found with ID: ${report_id}`;
                }
            }
        }

        // Fetch all reports for the logged-in user
        const allReports = await pool.query(
            'SELECT * FROM reports WHERE user_id = $1',
            [userId]
        );

        const reports = allReports.rows;

        // If no reports exist for the user
        if (reports.length === 0) {
            message = message || "No reports submitted yet.";
        }

        res.render('track', {
            searchedReport,
            reports,
            message, // Pass the message to the template
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).send('Internal Server Error');
    }
});


// User dashboard or report confirmation (after report submission)
app.get('/dashboard', async (req, res) => {
    try {
        // Fetch the latest reports with their status from the database
        const query = 'SELECT * FROM reports';
        const result = await pool.query(query);

        // Pass the fetched reports data to the EJS template
        res.render('dashboard', { reports: result.rows });
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).send('Internal Server Error');
    }
});


// Route to update the report status
app.post('/update-report-status/:reportId', async (req, res) => {
    const { reportId } = req.params;
    const { status } = req.body;

    try {
        // Validate the status value (only allow 'inprogress' or 'completed')
        if (!['inprogress', 'completed'].includes(status)) {
            return res.status(400).send('Invalid status');
        }

        // Update the status in the database
        const query = 'UPDATE reports SET status = $1 WHERE report_id = $2';
        const result = await pool.query(query, [status, reportId]);

        if (result.rowCount === 0) {
            return res.status(404).send('Report not found');
        }

        // Respond with success
        res.status(200).send('Status updated successfully');
    } catch (err) {
        console.error('Error updating report status:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log("Server running on port: " + port);
});


app.get("/help", (req, res) => {

    // Pass user_id to the EJS template
    res.render("help.ejs");
});

app.get("/home", (req, res) => {
    // Pass user_id to the EJS template
    res.render("new_home.ejs");
});

app.get("/nhelp", (req, res) => {

    // Pass user_id to the EJS template
    res.render("new_help.ejs");
});