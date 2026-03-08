const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { db: firestore } = require('../utils/firebase');
const { collection, setDoc, doc } = require('firebase/firestore');
const Order = require('../models/Order'); // Import MongoDB Model

// Get all orders (for distributor/admin)
router.get('/', (req, res) => {
    const orders = db.orders.getAll();
    res.json(orders);
});

// Get user orders
router.get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    const orders = db.orders.getAll().filter(o => o.userId === userId);
    res.json(orders);
});

// Create new order
router.post('/', async (req, res) => {
    const { userId, items, total, isTestMode } = req.body;

    // 1. Check if all items are in stock
    const products = db.products.getAll();
    const outOfStockItems = [];

    items.forEach(orderItem => {
        const product = products.find(p => p.id == orderItem.id);
        if (!product || product.stock < orderItem.qty) {
            outOfStockItems.push(orderItem.name);
        }
    });

    if (outOfStockItems.length > 0) {
        return res.status(400).json({
            message: `The following items are out of stock or have insufficient quantity: ${outOfStockItems.join(', ')}`
        });
    }

    // 2. Deduct stock
    items.forEach(orderItem => {
        const productIndex = products.findIndex(p => p.id == orderItem.id);
        if (productIndex !== -1) {
            products[productIndex].stock -= orderItem.qty;
        }
    });
    db.products.save(products);

    // 3. Create the order with appropriate prefix and sequential number
    const prefix = isTestMode ? 'SAM' : 'ORD';
    console.log(`Creating order - Mode: ${isTestMode ? 'Test' : 'Real'}, Prefix: ${prefix}`);

    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    // Get today's orders to calculate next sequential number
    const allOrders = db.orders.getAll();
    const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.toDateString() === today.toDateString() && order.id.startsWith(prefix);
    });
    const nextNumber = String(todayOrders.length + 1).padStart(2, '0');

    const newOrder = {
        id: `${prefix}-${dateStr}-${nextNumber}`,
        userId,
        items,
        total,
        status: 'Pending',
        date: new Date().toISOString(),
        paymentMode: isTestMode ? 'Test Mode' : 'Razorpay'
    };

    db.orders.create(newOrder);

    // Add directly to Firebase Firestore
    try {
        await setDoc(doc(collection(firestore, 'orders'), String(newOrder.id)), newOrder);
        console.log(`Order ${newOrder.id} successfully saved to Firebase.`);
    } catch (fbError) {
        console.error('Error saving order to Firebase:', fbError);
    }

    // Add directly to MongoDB
    try {
        const mongoOrder = new Order(newOrder);
        await mongoOrder.save();
        console.log(`Order ${newOrder.id} successfully saved to MongoDB.`);
    } catch (mongoError) {
        console.error('Error saving order to MongoDB:', mongoError);
    }

    // Get user info for notification
    const users = db.users.getAll();
    const user = users.find(u => u.id === userId);

    // Trigger real-time notification via Socket.IO
    if (req.io) {
        req.io.emit('order_received', {
            orderId: newOrder.id,
            userName: user ? user.name : 'Unknown User',
            total: newOrder.total
        });
    }

    res.status(201).json(newOrder);
});

// Update order status (for distributor)
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    let orders = db.orders.getAll();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
        return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = orders[orderIndex].status;
    orders[orderIndex].status = status;
    db.orders.save(orders);

    // Update the existing order directly in Firebase Firestore
    try {
        // We set merge: true so we don't accidentally overwrite the whole doc if it differs
        await setDoc(doc(collection(firestore, 'orders'), String(id)), { status: status }, { merge: true });
        console.log(`Order ${id} status updated in Firebase.`);
    } catch (fbError) {
        console.error('Error updating order status in Firebase:', fbError);
    }

    // Update the existing order directly in MongoDB
    try {
        await Order.findOneAndUpdate({ id: id }, { status: status });
        console.log(`Order ${id} status updated in MongoDB.`);
    } catch (mongoError) {
        console.error('Error updating order status in MongoDB:', mongoError);
    }

    // Trigger real-time notification via Socket.IO
    if (req.io && oldStatus !== status) {
        console.log(`Emitting status update for order ${id}: ${oldStatus} -> ${status} (For User: ${orders[orderIndex].userId})`);
        req.io.emit('order_status_updated', {
            orderId: orders[orderIndex].id,
            userId: String(orders[orderIndex].userId),
            status: status
        });
    }

    res.json(orders[orderIndex]);
});

module.exports = router;
