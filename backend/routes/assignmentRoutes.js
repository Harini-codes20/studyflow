const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Simple JSON-file "database" (no install needed)
const DATA_FILE = path.join(__dirname, '../../database/assignments.json');

// Helper: read all assignments
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Read error:', err);
    return [];
  }
}

// Helper: write all assignments
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Write error:', err);
  }
}

// GET all assignments
router.get('/', (req, res) => {
  res.json(readData());
});

// POST new assignment
router.post('/', (req, res) => {
  const { subject, title, deadline, status, priority } = req.body;
  if (!subject || !title || !deadline) {
    return res.status(400).json({ error: 'subject, title, deadline required' });
  }

  const list = readData();
  const newItem = {
    id: list.length ? Math.max(...list.map(x => x.id)) + 1 : 1,
    subject,
    title,
    deadline,
    status: status || 'Pending',
    priority: priority || 'Medium',
    createdAt: Date.now()
  };
  list.push(newItem);
  writeData(list);
  res.json(newItem);
});

// PUT update assignment
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const list = readData();
  const idx = list.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  list[idx] = { ...list[idx], ...req.body, id };
  writeData(list);
  res.json(list[idx]);
});

// DELETE assignment
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const list = readData().filter(x => x.id !== id);
  writeData(list);
  res.json({ deleted: true });
});

module.exports = router;