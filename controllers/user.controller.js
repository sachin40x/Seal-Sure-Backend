const express = require('express');
const { User } = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        console.log('Signup attempt for email:', email, 'username:', username);
        
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        console.log('Existing user check:', existingUser ? 'User exists' : 'No existing user');
        
        if (existingUser) {
            console.log('User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password and save new user
        console.log('Creating new user...');
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        console.log('User created successfully:', user._id);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        console.log('Signup successful for user:', user.username);
        res.status(201).json({ message: 'User created successfully', token });

    } catch (error) {
        console.error('Error during signup:', error);
        console.error('Error details:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log('Signin attempt for email:', email);
        
        // Find user by email
        const user = await User.findOne({ email });
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('User does not exist');
            return res.status(400).json({ message: 'User does not exist' });
        }

        // Compare provided password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            console.log('Invalid credentials');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('Signin successful for user:', user.username);
        // Respond with token and username
        res.status(200).json({ message: 'Signin successful', token, username: user.username });

    } catch (error) {
        console.error('Error during signin:', error);
        console.error('Error details:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


module.exports = { signup, signin };
