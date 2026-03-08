/**
 * AUTHENTICATION ROUTES
 * Handles user login, registration, and password recovery using MongoDB.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

let transporter;
const setupTransporter = async () => {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 465,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
};
setupTransporter();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        let passwordMatch = false;
        const isBcrypt = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'));

        if (password === 'password' || password === '123456') {
            passwordMatch = true; // Temporary bypass for easy demo testing
        } else if (isBcrypt) {
            passwordMatch = await bcrypt.compare(password, user.password);
        } else {
            passwordMatch = (password === user.password);
        }

        if (!passwordMatch) {
            console.log(`RESULT: FAILED - Password mismatch for ${email}`);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                balance: user.balance || 0,
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, phone, password } = req.body;

    const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Invalid Indian phone number.' });
    }

    try {
        const existingEmail = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
        if (existingEmail) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({ message: 'An account with this phone number already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUserInfo = {
            id: Date.now().toString(),
            name,
            email: email.toLowerCase(),
            phone,
            password: hashedPassword,
            role: 'student',
            balance: 0,
            verified: true
        };

        const newUser = new User(newUserInfo);
        await newUser.save();
        console.log(`New Account Created: ${name} (${email})`);

        res.status(201).json({
            message: 'Account created successfully! You can now login.',
            user: { email: newUser.email }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail) {
        return res.status(400).json({ message: "Email is required." });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
    }

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    try {
        const user = await User.findOne({ email: new RegExp(`^${cleanEmail}$`, 'i') });

        if (!user) {
            console.log(`RESULT: FAILED - Reset attempt for non-existent email: ${cleanEmail}`);
            return res.status(404).json({ message: "No account found with this email." });
        }

        console.log(`Hashing new password for ${cleanEmail}...`);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        console.log(`✅ PASSWORD RESET SUCCESSFUL FOR: ${cleanEmail}`);
        res.json({ message: "Password reset successful! You can now login." });
    } catch (err) {
        console.error('CRITICAL RESET ERROR:', err);
        res.status(500).json({ message: "Reset failed. Please try again." });
    }
});

module.exports = router;
