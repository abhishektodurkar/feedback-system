# ClearResponse

ClearResponse is a web-based feedback collection system built with HTML, CSS, JavaScript, Node.js, Express, MongoDB, and MongoDB Compass.

## Tools Used

- VS Code
- MongoDB Compass
- MongoDB Community Server
- Node.js
- Express.js
- MongoDB with Mongoose

## How To Run

1. Start MongoDB on your computer.
2. Open a terminal in the project folder.
3. Run the backend:

```powershell
cd backend
npm install
node server.js
```

4. Open `frontend/index.html` in your browser.

## Login And Registration

Use `frontend/index.html` for both normal users and admins.

- Select `Normal User` to login as a regular user.
- Select `Admin` to login as an admin.
- Use `frontend/register.html` to create either type of account.

Optional: create the default admin user once:

```powershell
cd backend
node admin.js
```

Then login from `frontend/index.html` as:

```text
Email: admin@example.com
Password: admin123
```

## Main Features

- User registration and login
- Secure password hashing with bcrypt
- JWT authentication for protected pages
- Feedback form with category, channel, rating, message, and form version
- User feedback history
- Admin dashboard
- Feedback analytics with visual bar charts
- Feedback status tracking: pending, reviewed, resolved, rejected
- Feedback moderation with admin notes
- Audit logs for important actions
- JSON and CSV export
- Basic notification support through email configuration
- Responsive user interface for desktop and mobile
- Custom form version creation from the admin dashboard

## Requirement Coverage

- User-friendly interface: modern responsive frontend pages.
- Customizable forms: admin can create new form versions with categories and channels.
- Real-time data submission: feedback is submitted directly to the backend and stored immediately.
- Secure authentication: JWT login and bcrypt password hashing.
- Multi-channel accessibility: feedback includes channel options like Website, Mobile, Email, and In person.
- Notification system: backend has email notification support using Nodemailer.
- Analytics tools: admin dashboard shows totals, average rating, priority count, and bar charts.
- Feedback tracking: every feedback has a status and status history.
- Data security: passwords are hashed and protected routes require tokens.
- Regular audits: audit logs record registration, login, feedback submission, form changes, and status changes.
- Visual representations: dashboard charts show status, category, and rating summaries.
- Version control for forms: every feedback stores the active form version used during submission.
- Individual feedback histories: users can see their own previous feedback.
- Integration and export: feedback can be exported as JSON or CSV.
- Feedback moderation: admin can update status and add notes.
