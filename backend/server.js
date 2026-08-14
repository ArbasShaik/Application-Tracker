require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const zlib = require('zlib');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Application = require('./models/Application');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Auth Routes ──────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already registered' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: signToken(user._id), name: user.name });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ token: signToken(user._id), name: user.name });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Application Routes (protected) ──────────────────────────
app.get('/api/applications', auth, async (req, res) => {
  const apps = await Application.find({ user: req.user.id }).select('-resume.data').sort({ createdAt: -1 });
  res.json(apps);
});

app.post('/api/applications', auth, upload.single('resume'), async (req, res) => {
  try {
    const payload = { ...req.body, user: req.user.id, offerLetterReceived: req.body.offerLetterReceived === 'true' };
    if (req.file) {
      payload.resume = {
        data:        zlib.gzipSync(req.file.buffer),
        contentType: req.file.mimetype,
        filename:    req.file.originalname,
      };
    }
    const created = await Application.create(payload);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/applications/:id', auth, async (req, res) => {
  try {
    const updated = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, req.body, { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/applications/:id', auth, async (req, res) => {
  await Application.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.json({ message: 'Deleted' });
});

app.get('/api/applications/:id/resume', auth, async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, user: req.user.id }).select('resume');
  if (!application?.resume?.data) return res.status(404).json({ error: 'No resume found' });
  const decompressed = zlib.gunzipSync(application.resume.data);
  res.set('Content-Type', application.resume.contentType);
  res.set('Content-Disposition', `attachment; filename="${application.resume.filename}"`);
  res.send(decompressed);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
