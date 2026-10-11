const express = require('express');
const path = require('path');
const assignmentRoutes = require('./routes/assignmentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve the frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/assignments', assignmentRoutes);

// Fallback: send index.html for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ StudyFlow server running on port ${PORT}`);
});