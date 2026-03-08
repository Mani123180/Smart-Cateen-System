/**
 * SMART CANTEEN BACKEND SERVER
 * Main entry point that initializes Express, Socket.io, and Middleware.
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_canteen', { family: 4 })
.then(() => console.log('Successfully connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

/**
 * Socket.IO Initialization
 * Allows real-time bi-directional communication (e.g., instant order notifications).
 */
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

/**
 * GLOBAL MIDDLEWARE
 */
app.use(cors()); // Allow Cross-Origin Resource Sharing
app.use(bodyParser.json({ limit: '50mb' })); // Support JSON-encoded bodies
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // Support URL-encoded bodies

/**
 * SOCKET INJECTION
 * Injects the 'io' instance into every request object so routes can emit events.
 */
app.use((req, res, next) => {
    req.io = io;
    next();
});

/**
 * ROUTE DEFINITIONS
 * Maps URL paths to specific route files.
 */
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const settingsRoutes = require('./routes/settings');
const complaintRoutes = require('./routes/complaints');
const paymentRoutes = require('./routes/payments');

// Root test route
app.get('/', (req, res) => {
    res.send('Smart Canteen API is running. Please access the application through the frontend.');
});

// API Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/payment', paymentRoutes);

/**
 * SOCKET.IO EVENT HANDLERS
 * Manages active user connections and real-time messaging.
 */
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Listen for new orders to notify distributors
    socket.on('new_order', (data) => {
        io.emit('order_received', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

/**
 * SERVER STARTUP
 */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
