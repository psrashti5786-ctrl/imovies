const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const sign = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const safe = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(400).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, password }); // role is always "user" on signup
  res.status(201).json({ user: safe(user), token: sign(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ user: safe(user), token: sign(user) });
});

exports.me = asyncHandler(async (req, res) => res.json({ user: safe(req.user) }));
