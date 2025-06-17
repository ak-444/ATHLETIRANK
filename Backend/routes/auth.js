const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    console.log('📍 Auth test route hit');
    res.json({ message: 'Auth routes working!' });
});

// GET route for login endpoint (for testing only)
router.get('/login', (req, res) => {
    res.json({ 
        message: 'Login endpoint is working! Use POST request to actually login.',
        method: 'POST',
        endpoint: '/api/auth/login',
        body: {
            email: 'user@example.com',
            password: 'yourpassword'
        }
    });
});

// GET route for register endpoint (for testing only)
router.get('/register', (req, res) => {
    res.json({ 
        message: 'Register endpoint is working! Use POST request to actually register.',
        method: 'POST',
        endpoint: '/api/auth/register',
        body: {
            username: 'yourusername',
            email: 'user@example.com',
            password: 'yourpassword'
        }
    });
});

// Register route with detailed logging
router.post('/register', async (req, res) => {
    console.log('📍 Register route hit');
    console.log('📦 Request body:', req.body);
    
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        console.log('✅ Input validation passed');
        console.log('👤 Attempting to register:', { username, email, password: '[HIDDEN]' });

        // Check if user already exists
        console.log('🔍 Checking if user already exists...');
        const [existingUsers] = await pool.execute(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        console.log('🔍 Existing users found:', existingUsers.length);

        if (existingUsers.length > 0) {
            console.log('❌ User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }

        console.log('✅ User does not exist, proceeding with registration');

        // Hash password
        console.log('🔐 Hashing password...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('✅ Password hashed successfully');

        // Insert new user
        console.log('💾 Inserting user into database...');
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        console.log('✅ User inserted successfully');
        console.log('📊 Insert result:', result);

        res.status(201).json({ 
            message: 'User registered successfully',
            userId: result.insertId,
            debug: {
                affectedRows: result.affectedRows,
                insertId: result.insertId
            }
        });

    } catch (error) {
        console.error('💥 Registration error:', error);
        console.error('💥 Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Server error during registration',
            error: error.message 
        });
    }
});

// Login route with logging
router.post('/login', async (req, res) => {
    console.log('📍 Login route hit');
    console.log('📦 Request body:', { email: req.body.email, password: '[HIDDEN]' });
    
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        console.log('🔍 Looking for user with email:', email);
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        console.log('🔍 Users found:', users.length);

        if (users.length === 0) {
            console.log('❌ No user found with that email');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        console.log('👤 User found:', { id: user.id, username: user.username, email: user.email });

        // Check password
        console.log('🔐 Checking password...');
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('🔐 Password valid:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('❌ Invalid password');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        console.log('🎫 Generating JWT token...');
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Login successful for user:', user.username);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('💥 Login error:', error);
        console.error('💥 Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Server error during login',
            error: error.message 
        });
    }
});

module.exports = router;