// server.js - Complete Backend for Learn Loop
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'learn-loop-secret-key-2024';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learn-loop';

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Content Database (matching frontend)
const CONTENT_DB = {
    'sql': {
        name: 'SQL & Excel',
        learning: {
            resource: 'SQLZoo & Excel Pivot Tables Guide',
            task: 'Import "Sales_Data.csv" into Excel. Create a Pivot Table showing Total Sales per Region. Write a SQL query to replicate this result.'
        },
        challenge: {
            task: 'Advanced Data Cleaning: You have duplicate records and NULL values in the "Transactions" table. Write a SQL script to identify duplicates, remove them, and impute missing numerical values with the average.'
        }
    },
    'python': {
        name: 'Python for Data',
        learning: {
            resource: 'Automate the Boring Stuff / Pandas Documentation',
            task: 'Write a Python script that reads a CSV file, filters rows where "Sales > 1000", and saves the result to a new file.'
        },
        challenge: {
            task: 'Build an ETL Pipeline: Write a Python script that fetches data from a public API (e.g., JSONPlaceholder), transforms the nested JSON into a flat structure, and loads it into a SQLite database.'
        }
    },
    'stats': {
        name: 'Statistics',
        learning: {
            resource: 'Khan Academy: Statistics & Probability',
            task: 'Given a dataset of student heights, calculate Mean, Median, Mode, and Standard Deviation manually (using Python or Excel).'
        },
        challenge: {
            task: 'A/B Testing Analysis: Analyze provided dataset "Experiment_Results.csv". Determine if the new feature (Group B) has a statistically significant lift in conversion rate compared to the control (Group A) using a T-test.'
        }
    },
    'viz': {
        name: 'Data Visualization',
        learning: {
            resource: 'Matplotlib / Seaborn Tutorials',
            task: 'Create a Bar Chart and a Scatter Plot using Python (Matplotlib) showing the relationship between "Ad Spend" and "Revenue".'
        },
        challenge: {
            task: 'Interactive Dashboard: Create a PowerBI or Tableau dashboard connected to the "Sales_Data" source. It must include filters for Year and Product Category, and a KPI card for YOY Growth.'
        }
    }
};

// Career paths based on interests and language
const CAREER_PATHS = {
    'data': {
        'python': [
            { title: 'Data Scientist', category: 'Research & Prediction', icon: '🔬', description: 'Based on your interest in Data Analysis and Python.' },
            { title: 'Data Analyst', category: 'Business Intelligence', icon: '📊', description: 'Based on your interest in Data Analysis and Python.' },
            { title: 'ML Engineer', category: 'AI & Automation', icon: '🤖', description: 'Based on your interest in Data Analysis and Machine Learning.' }
        ],
        'javascript': [
            { title: 'Data Analyst', category: 'Business Intelligence', icon: '📊', description: 'Based on your interest in Data Analysis and JavaScript.' },
            { title: 'BI Developer', category: 'Data Visualization', icon: '📈', description: 'Based on your interest in Data Analysis and Web Development.' }
        ],
        'java': [
            { title: 'Data Engineer', category: 'Big Data', icon: '⚙️', description: 'Based on your interest in Data Analysis and Java.' },
            { title: 'Data Analyst', category: 'Business Intelligence', icon: '📊', description: 'Based on your interest in Data Analysis and Java.' }
        ],
        'csharp': [
            { title: 'Data Engineer', category: 'Big Data', icon: '⚙️', description: 'Based on your interest in Data Analysis and C#.' },
            { title: 'BI Developer', category: 'Data Visualization', icon: '📈', description: 'Based on your interest in Data Analysis and C#.' }
        ]
    },
    'ml': {
        'python': [
            { title: 'ML Engineer', category: 'AI & Automation', icon: '🤖', description: 'Based on your interest in Machine Learning and Python.' },
            { title: 'Data Scientist', category: 'Research & Prediction', icon: '🔬', description: 'Based on your interest in Machine Learning and Python.' },
            { title: 'AI Engineer', category: 'Advanced AI', icon: '🧠', description: 'Based on your interest in Machine Learning and Python.' }
        ],
        'javascript': [
            { title: 'ML Engineer', category: 'AI & Automation', icon: '🤖', description: 'Based on your interest in Machine Learning and JavaScript.' },
            { title: 'AI Engineer', category: 'Advanced AI', icon: '🧠', description: 'Based on your interest in Machine Learning and JavaScript.' }
        ],
        'java': [
            { title: 'ML Engineer', category: 'AI & Automation', icon: '🤖', description: 'Based on your interest in Machine Learning and Java.' },
            { title: 'Data Scientist', category: 'Research & Prediction', icon: '🔬', description: 'Based on your interest in Machine Learning and Java.' }
        ],
        'csharp': [
            { title: 'ML Engineer', category: 'AI & Automation', icon: '🤖', description: 'Based on your interest in Machine Learning and C#.' },
            { title: 'AI Engineer', category: 'Advanced AI', icon: '🧠', description: 'Based on your interest in Machine Learning and C#.' }
        ]
    },
    'web': {
        'python': [
            { title: 'Full Stack Developer', category: 'Web Development', icon: '🌐', description: 'Based on your interest in Web Development and Python.' },
            { title: 'Backend Developer', category: 'Server-side', icon: '⚙️', description: 'Based on your interest in Web Development and Python.' }
        ],
        'javascript': [
            { title: 'Full Stack Developer', category: 'Web Development', icon: '🌐', description: 'Based on your interest in Web Development and JavaScript.' },
            { title: 'Frontend Developer', category: 'Client-side', icon: '🎨', description: 'Based on your interest in Web Development and JavaScript.' },
            { title: 'Backend Developer', category: 'Server-side', icon: '⚙️', description: 'Based on your interest in Web Development and JavaScript.' }
        ],
        'java': [
            { title: 'Full Stack Developer', category: 'Web Development', icon: '🌐', description: 'Based on your interest in Web Development and Java.' },
            { title: 'Backend Developer', category: 'Server-side', icon: '⚙️', description: 'Based on your interest in Web Development and Java.' }
        ],
        'csharp': [
            { title: 'Full Stack Developer', category: 'Web Development', icon: '🌐', description: 'Based on your interest in Web Development and C#.' },
            { title: 'Backend Developer', category: 'Server-side', icon: '⚙️', description: 'Based on your interest in Web Development and C#.' }
        ]
    },
    'mobile': {
        'python': [
            { title: 'Mobile Developer', category: 'Cross-platform', icon: '📱', description: 'Based on your interest in Mobile Development and Python.' }
        ],
        'javascript': [
            { title: 'Mobile Developer', category: 'Cross-platform', icon: '📱', description: 'Based on your interest in Mobile Development and JavaScript.' }
        ],
        'java': [
            { title: 'Android Developer', category: 'Mobile OS', icon: '🤖', description: 'Based on your interest in Mobile Development and Java.' }
        ],
        'csharp': [
            { title: 'Mobile Developer', category: 'Cross-platform', icon: '📱', description: 'Based on your interest in Mobile Development and C#.' }
        ]
    },
    'cloud': {
        'python': [
            { title: 'Cloud Engineer', category: 'Infrastructure', icon: '☁️', description: 'Based on your interest in Cloud Computing and Python.' },
            { title: 'DevOps Engineer', category: 'CI/CD', icon: '🔄', description: 'Based on your interest in Cloud Computing and Python.' }
        ],
        'javascript': [
            { title: 'Cloud Engineer', category: 'Infrastructure', icon: '☁️', description: 'Based on your interest in Cloud Computing and JavaScript.' },
            { title: 'DevOps Engineer', category: 'CI/CD', icon: '🔄', description: 'Based on your interest in Cloud Computing and JavaScript.' }
        ],
        'java': [
            { title: 'Cloud Engineer', category: 'Infrastructure', icon: '☁️', description: 'Based on your interest in Cloud Computing and Java.' },
            { title: 'DevOps Engineer', category: 'CI/CD', icon: '🔄', description: 'Based on your interest in Cloud Computing and Java.' }
        ],
        'csharp': [
            { title: 'Cloud Engineer', category: 'Infrastructure', icon: '☁️', description: 'Based on your interest in Cloud Computing and C#.' },
            { title: 'DevOps Engineer', category: 'CI/CD', icon: '🔄', description: 'Based on your interest in Cloud Computing and C#.' }
        ]
    },
    'security': {
        'python': [
            { title: 'Security Engineer', category: 'Cybersecurity', icon: '🔒', description: 'Based on your interest in Cybersecurity and Python.' },
            { title: 'Penetration Tester', category: 'Ethical Hacking', icon: '🔍', description: 'Based on your interest in Cybersecurity and Python.' }
        ],
        'javascript': [
            { title: 'Security Engineer', category: 'Cybersecurity', icon: '🔒', description: 'Based on your interest in Cybersecurity and JavaScript.' }
        ],
        'java': [
            { title: 'Security Engineer', category: 'Cybersecurity', icon: '🔒', description: 'Based on your interest in Cybersecurity and Java.' }
        ],
        'csharp': [
            { title: 'Security Engineer', category: 'Cybersecurity', icon: '🔒', description: 'Based on your interest in Cybersecurity and C#.' }
        ]
    }
};

// In-memory storage for demo (in production, use MongoDB)
const users = new Map();
const submissions = new Map();

// User Schema (for reference)
const userSchema = {
    userId: String,
    password: String,
    interests: [String],
    language: String,
    selectedCareer: Object,
    skills: {
        sql: Boolean,
        python: Boolean,
        stats: Boolean,
        viz: Boolean
    },
    submissions: {
        sql: Boolean,
        python: Boolean,
        stats: Boolean,
        viz: Boolean
    },
    createdAt: Date
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Helper Functions
const createToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

const getUser = (userId) => {
    return users.get(userId);
};

const saveUser = (userId, userData) => {
    users.set(userId, userData);
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        
        if (!userId || !password) {
            return res.status(400).json({ message: 'User ID and password required' });
        }
        
        // Find or create user
        let user = getUser(userId);
        
        if (!user) {
            // Create new user with hashed password
            const hashedPassword = await hashPassword(password);
            user = {
                userId,
                password: hashedPassword,
                interests: [],
                language: 'python',
                selectedCareer: null,
                skills: { sql: false, python: false, stats: false, viz: false },
                submissions: { sql: false, python: false, stats: false, viz: false },
                createdAt: new Date()
            };
            saveUser(userId, user);
        } else {
            // Verify password
            const passwordMatch = await comparePassword(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        }
        
        // Create JWT token
        const token = createToken(userId);
        
        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({ token, user: userWithoutPassword });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Save interests and language
app.post('/api/user/preferences', authenticateToken, (req, res) => {
    try {
        const { interests, language } = req.body;
        
        // Validate at least 2 interests
        if (!interests || interests.length < 2) {
            return res.status(400).json({ message: 'Please select at least 2 interests' });
        }
        
        const user = getUser(req.user.userId);
        if (user) {
            user.interests = interests;
            user.language = language || 'python';
            saveUser(req.user.userId, user);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Save preferences error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get career recommendations
app.get('/api/career-recommendations', authenticateToken, (req, res) => {
    try {
        const user = getUser(req.user.userId);
        
        if (!user || !user.interests || !user.language) {
            return res.status(400).json({ message: 'User preferences not set' });
        }
        
        // Get unique career paths based on interests
        const careerSet = new Set();
        user.interests.forEach(interest => {
            if (CAREER_PATHS[interest] && CAREER_PATHS[interest][user.language]) {
                CAREER_PATHS[interest][user.language].forEach(career => {
                    careerSet.add(JSON.stringify(career));
                });
            }
        });
        
        // Convert back to array
        const careers = Array.from(careerSet).map(careerStr => JSON.parse(careerStr));
        
        res.json({ careers });
    } catch (error) {
        console.error('Career recommendations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Save selected career
app.post('/api/user/career', authenticateToken, (req, res) => {
    try {
        const { career } = req.body;
        
        if (!career) {
            return res.status(400).json({ message: 'Career selection required' });
        }
        
        const user = getUser(req.user.userId);
        if (user) {
            user.selectedCareer = career;
            saveUser(req.user.userId, user);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Save career error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
    try {
        const user = getUser(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Save skills assessment
app.post('/api/user/skills', authenticateToken, (req, res) => {
    try {
        const { skills } = req.body;
        
        const user = getUser(req.user.userId);
        if (user) {
            user.skills = { ...user.skills, ...skills };
            saveUser(req.user.userId, user);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Save skills error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get roadmap content
app.get('/api/roadmap', authenticateToken, (req, res) => {
    try {
        const user = getUser(req.user.userId);
        
        if (!user || !user.selectedCareer) {
            return res.status(400).json({ message: 'Career not selected' });
        }
        
        // Return content DB and user skills/submissions
        res.json({
            content: CONTENT_DB,
            skills: user.skills,
            submissions: user.submissions,
            career: user.selectedCareer
        });
    } catch (error) {
        console.error('Get roadmap error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit project for validation
app.post('/api/submit-project', authenticateToken, async (req, res) => {
    try {
        const { skill, link, notes } = req.body;
        
        if (!skill || !CONTENT_DB[skill]) {
            return res.status(400).json({ message: 'Invalid skill' });
        }
        
        if (!link) {
            return res.status(400).json({ message: 'Project link is required' });
        }
        
        // Store submission
        const submissionId = `${req.user.userId}_${skill}_${Date.now()}`;
        submissions.set(submissionId, {
            userId: req.user.userId,
            skill,
            link,
            notes,
            submittedAt: new Date(),
            status: 'pending'
        });
        
        // Simulate AI validation (in production, this would call an AI service)
        setTimeout(() => {
            const submission = submissions.get(submissionId);
            if (submission) {
                // Simulate successful validation
                submission.status = 'validated';
                submission.validatedAt = new Date();
                
                // Update user submissions
                const user = getUser(req.user.userId);
                if (user) {
                    user.submissions[skill] = true;
                    saveUser(req.user.userId, user);
                }
                
                console.log(`Project for ${skill} validated for user ${req.user.userId}`);
            }
        }, 2000 + Math.random() * 3000); // 2-5 seconds delay
        
        res.json({ 
            message: 'Project submitted for validation',
            submissionId
        });
    } catch (error) {
        console.error('Submit project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Check submission status
app.get('/api/submission-status/:skill', authenticateToken, (req, res) => {
    try {
        const { skill } = req.params;
        const user = getUser(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const isSubmitted = user.submissions[skill] || false;
        res.json({ submitted: isSubmitted });
    } catch (error) {
        console.error('Check submission status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all submissions (admin endpoint)
app.get('/api/admin/submissions', authenticateToken, (req, res) => {
    try {
        const allSubmissions = Array.from(submissions.values());
        res.json({ submissions: allSubmissions });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user statistics
app.get('/api/user/stats', authenticateToken, (req, res) => {
    try {
        const user = getUser(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const completedSkills = Object.entries(user.submissions).filter(([_, completed]) => completed).length;
        const totalSkills = Object.keys(user.submissions).length;
        const progress = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;
        
        res.json({
            completedSkills,
            totalSkills,
            progress,
            career: user.selectedCareer,
            language: user.language,
            interestsCount: user.interests.length,
            joinedAt: user.createdAt
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user account
app.delete('/api/user/account', authenticateToken, (req, res) => {
    try {
        users.delete(req.user.userId);
        
        // Remove user's submissions
        for (const [key, submission] of submissions.entries()) {
            if (submission.userId === req.user.userId) {
                submissions.delete(key);
            }
        }
        
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create default HTML file if it doesn't exist
const createDefaultHTML = () => {
    const htmlPath = path.join(__dirname, 'index.html');
    if (!fs.existsSync(htmlPath)) {
        const defaultHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Learn Loop | Adaptive AI</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #050b14;
            color: #e2e8f0;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(0, 240, 255, 0.2);
            border-radius: 12px;
            padding: 2.5rem;
            max-width: 400px;
            width: 100%;
            text-align: center;
        }
        h1 {
            color: #00f0ff;
            margin-bottom: 0.5rem;
        }
        p {
            color: #64748b;
            margin-bottom: 2rem;
        }
        input {
            width: 100%;
            padding: 12px;
            margin-bottom: 1rem;
            background: rgba(0,0,0,0.4);
            border: 1px solid #334155;
            border-radius: 4px;
            color: white;
            box-sizing: border-box;
        }
        button {
            width: 100%;
            padding: 12px 24px;
            background: rgba(0, 240, 255, 0.05);
            color: #00f0ff;
            border: 1px solid #00f0ff;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: 0.3s;
        }
        button:hover {
            background: #00f0ff;
            color: #000;
        }
        .error {
            color: #ef4444;
            margin-top: 1rem;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Learn Loop Backend</h1>
        <p>API Server is running</p>
        <div id="response"></div>
    </div>
    <script>
        // Test API endpoints
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('response').innerHTML = 
                    '<div style="color: #00ff9d;">✓ Backend is running!</div>' +
                    '<div style="margin-top: 10px; font-size: 0.9rem;">' +
                    'Status: ' + data.status + '<br>' +
                    'Time: ' + new Date(data.timestamp).toLocaleString() +
                    '</div>';
            })
            .catch(error => {
                document.getElementById('response').innerHTML = 
                    '<div class="error">✗ Error connecting to backend</div>';
            });
    </script>
</body>
</html>`;
        fs.writeFileSync(htmlPath, defaultHTML);
    }
};

// Serve the frontend
app.get('*', (req, res) => {
    const htmlPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        createDefaultHTML();
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Initialize and start server
const startServer = async () => {
    try {
        console.log('🚀 Starting Learn Loop Backend Server...');
        console.log(`📡 Port: ${PORT}`);
        console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
        console.log(`🗄️  MongoDB: ${MONGODB_URI}`);
        console.log('✅ Server initialized successfully');
        
        // Create default HTML if needed
        createDefaultHTML();
        
        app.listen(PORT, () => {
            console.log(`\n🌟 Server is running on http://localhost:${PORT}`);
            console.log('📊 Health check: http://localhost:' + PORT + '/api/health');
            console.log('📝 API Documentation:');
            console.log('   POST /api/login - User authentication');
            console.log('   GET  /api/user/profile - Get user profile');
            console.log('   POST /api/user/preferences - Save interests & language');
            console.log('   GET  /api/career-recommendations - Get career paths');
            console.log('   POST /api/user/career - Save selected career');
            console.log('   POST /api/user/skills - Save skill assessment');
            console.log('   GET  /api/roadmap - Get roadmap content');
            console.log('   POST /api/submit-project - Submit project for validation');
            console.log('   GET  /api/submission-status/:skill - Check submission status');
            console.log('   GET  /api/user/stats - Get user statistics');
            console.log('   DELETE /api/user/account - Delete user account');
            console.log('   GET  /api/admin/submissions - Get all submissions (admin)');
            console.log('\n💡 Tip: Place your frontend HTML file as index.html in the same directory');
            console.log('🔑 Default login: any user ID with password "password"');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();