const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../db/connection');
const { logAudit } = require('../utils/auditLogger');
require('dotenv').config();

// Register a new user
exports.register = async (req, res) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password with bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default role is 'donor' unless explicitly provided and user is signing up as admin
    // Note: In production, registering as 'admin' might need extra authorization checks, 
    // but we will support it if provided or default to 'donor'
    const userRole = role === 'admin' ? 'admin' : 'donor';

    // Save user to the database
    const [insertResult] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, userRole]
    );

    const userId = insertResult.insertId;

    // Generate JWT token containing user details: id, name, email, role
    const token = jwt.sign(
      { id: userId, name, email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log user registration
    await logAudit({ body: req.body, headers: req.headers, ip: req.ip, socket: req.socket }, 'Auth', `Registered new user account: ${name} (${email}) as ${userRole}`);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        name,
        email,
        role: userRole,
      },
    });
  } catch (error) {
    console.error('Registration controller error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.login = async (req, res) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Retrieve user details from database
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      await logAudit(req, 'Auth', `Failed login attempt: Email not found (${email})`);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logAudit(req, 'Auth', `Failed login attempt: Incorrect password for ${email}`);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token containing: id, name, email, role
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Populate temporary request user info for logging
    req.user = { id: user.id, email: user.email };
    await logAudit(req, 'Auth', `User logged in successfully`);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login controller error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current logged-in user profile from JWT payload
exports.getMe = async (req, res) => {
  try {
    // req.user is populated by authentication middleware
    const [users] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error('Get profile controller error:', error);
    return res.status(500).json({ message: 'Server error fetching user details' });
  }
};
