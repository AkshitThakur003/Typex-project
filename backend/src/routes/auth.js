const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// Below: profile & preferences
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  delete user.passwordHash;
  res.json(user);
});

router.patch('/profile', auth, async (req, res) => {
  const { username, avatarUrl, avatarChoice, status } = req.body;
  const updates = {};
  if (username) updates.username = username;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl; // legacy support
  if (status !== undefined) updates.status = status;
  // If avatarChoice provided, set in preferences and keep top-level avatarUrl as empty string
  const prefSet = {};
  if (avatarChoice !== undefined) prefSet['preferences.avatarChoice'] = avatarChoice;
  if (status !== undefined) prefSet['preferences.status'] = status;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(Object.keys(updates).length ? updates : {}), ...(Object.keys(prefSet).length ? { $set: prefSet } : {}) },
      { new: true }
    );
    res.json({ ok: true, user: { id: user.id, username: user.username, avatarChoice: user.preferences?.avatarChoice, status: user.preferences?.status || user.status } });
  } catch (e) {
    res.status(400).json({ error: 'Update failed', details: e.message });
  }
});

router.patch('/preferences', auth, async (req, res) => {
  const allowed = ['defaultDifficulty','defaultTime','caretStyle','fontStyle','sounds','animations','theme','avatarChoice','status'];
  const payload = {};
  for (const k of allowed) if (k in req.body) payload[`preferences.${k}`] = req.body[k];
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { $set: payload }, { new: true }).lean();
    delete user.passwordHash;
    res.json({ ok: true, preferences: user.preferences });
  } catch (e) {
    res.status(400).json({ error: 'Preferences update failed', details: e.message });
  }
});

router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid current password' });
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ ok: true });
});

router.delete('/me', auth, async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.json({ ok: true });
});
