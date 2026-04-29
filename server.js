const express = require('express');
const cors = require('cors');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

// TEMP DATABASE (replace with Firebase later)
let users = [];
let jobs = [];
let applications = [];

// ===== USERS =====
app.post('/signup', (req, res) => {
  const { name, phone, skills, role } = req.body;

  const user = { id: randomUUID(), name, phone, skills, role };
  users.push(user);

  res.json(user);
});

// ===== JOBS =====
app.post('/jobs', (req, res) => {
  const job = { id: randomUUID(), ...req.body, createdAt: new Date() };
  jobs.unshift(job);
  res.json(job);
});

app.get('/jobs', (req, res) => {
  res.json(jobs);
});

// ===== APPLY =====
app.post('/apply', (req, res) => {
  const { userId, jobId } = req.body;

  const appEntry = {
    id: randomUUID(),
    userId,
    jobId,
    status: 'pending'
  };

  applications.push(appEntry);
  res.json(appEntry);
});

// ===== DASHBOARDS =====
app.get('/worker/:id', (req, res) => {
  const workerApps = applications.filter(a => a.userId === req.params.id);
  res.json(workerApps);
});

app.get('/employer/jobs', (req, res) => {
  res.json(jobs);
});

app.get('/employer/applications/:jobId', (req, res) => {
  const apps = applications.filter(a => a.jobId === req.params.jobId);
  res.json(apps);
});

app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => console.log(`API and website running on http://localhost:${port}`));
