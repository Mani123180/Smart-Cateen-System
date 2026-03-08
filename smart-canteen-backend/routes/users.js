const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, '-_id -password');
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create user
router.post('/', async (req, res) => {
    const { name, email, password, role, balance } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUserInfo = {
            id: Date.now().toString(),
            name,
            email,
            password, // In real app, hash this
            role: role || 'student',
            balance: parseFloat(balance) || 0,
        };

        const newUser = new User(newUserInfo);
        await newUser.save();

        const userResponse = newUser.toObject();
        delete userResponse._id;
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, role, balance } = req.body;

    try {
        const user = await User.findOne({ id: String(id) });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (balance !== undefined) user.balance = parseFloat(balance);

        await user.save();

        const userResponse = user.toObject();
        delete userResponse._id;
        delete userResponse.password;

        res.json(userResponse);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await User.deleteOne({ id: String(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
