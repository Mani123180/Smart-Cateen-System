const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // MongoDB Model
const Product = require('../models/Product'); // MongoDB Model
const User = require('../models/User'); // MongoDB Model
const { db: firestore } = require('../utils/firebase');
const { collection, setDoc, doc } = require('firebase/firestore');

// Get all orders (for distributor/admin)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });

        // Remove _id and __v for cleaner frontend use, match original signature
        const formattedOrders = orders.map(order => {
            const o = order.toObject();
            delete o._id;
            delete o.__v;
            return o;
        });

        res.json(formattedOrders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Server error while fetching orders' });
    }
});

// Get user orders
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const orders = await Order.find({ userId }).sort({ date: -1 });

        const formattedOrders = orders.map(order => {
            const o = order.toObject();
            delete o._id;
            delete o.__v;
            return o;
        });

        res.json(formattedOrders);
    } catch (err) {
        console.error('Error fetching user orders:', err);
        res.status(500).json({ message: 'Server error while fetching user orders' });
    }
});

// Create new order
router.post('/', async (req, res) => {
    const { userId, items, total, isTestMode } = req.body;

    try {
        // 1. Check if all items are in stock
        // Fetch all product IDs requested in the order
        const productIds = items.map(item => Number(item.id));
        const productsInDb = await Product.find({ id: { $in: productIds } });

        const outOfStockItems = [];

        items.forEach(orderItem => {
            const product = productsInDb.find(p => p.id === Number(orderItem.id));
            if (!product || product.stock < orderItem.qty) {
                outOfStockItems.push(orderItem.name);
            }
        });

        if (outOfStockItems.length > 0) {
            return res.status(400).json({
                message: `The following items are out of stock or have insufficient quantity: ${outOfStockItems.join(', ')}`
            });
        }

        // 2. Deduct stock directly in the database
        // We use bulkWrite to efficiently decrement stocks in one DB call
        const bulkOperations = items.map(orderItem => ({
            updateOne: {
                filter: { id: Number(orderItem.id) },
                update: { $inc: { stock: -orderItem.qty } }
            }
        }));

        if (bulkOperations.length > 0) {
            await Product.bulkWrite(bulkOperations);
        }

        // 3. Create the order with appropriate prefix and sequential number
        const prefix = isTestMode ? 'SAM' : 'ORD';
        console.log(`Creating order - Mode: ${isTestMode ? 'Test' : 'Real'}, Prefix: ${prefix}`);

        const today = new Date();
        // Zero out time to get start and end boundaries of today
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1); // Almost end of day

        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

        // Get today's orders count with this prefix FROM MongoDB to generate next number
        const todayPrefixCount = await Order.countDocuments({
            id: { $regex: `^${prefix}-` },
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        const nextNumber = String(todayPrefixCount + 1).padStart(2, '0');

        const newOrderData = {
            id: `${prefix}-${dateStr}-${nextNumber}`,
            userId,
            items: items.map(i => ({ id: Number(i.id), name: i.name, qty: Number(i.qty), price: Number(i.price) })),
            total: Number(total),
            status: 'Pending',
            date: new Date(),
            paymentMode: isTestMode ? 'Test Mode' : 'Razorpay'
        };

        // Save order to MongoDB
        const mongoOrder = new Order(newOrderData);
        await mongoOrder.save();
        console.log(`Order ${newOrderData.id} successfully saved to MongoDB.`);

        // Add backup to Firebase Firestore (Fire-and-forget, don't block response on it!)
        setDoc(doc(collection(firestore, 'orders'), String(newOrderData.id)), newOrderData)
            .then(() => console.log(`Order ${newOrderData.id} successfully backed up to Firebase.`))
            .catch(fbError => console.error('Error saving order to Firebase:', fbError));

        // Get user info for real-time socket notification
        const user = await User.findOne({ id: String(userId) });

        // Trigger real-time notification via Socket.IO
        if (req.io) {
            req.io.emit('order_received', {
                orderId: newOrderData.id,
                userName: user ? user.name : 'Unknown User',
                total: newOrderData.total
            });
        }

        const formattedOrder = mongoOrder.toObject();
        delete formattedOrder._id;
        delete formattedOrder.__v;

        res.status(201).json(formattedOrder);

    } catch (error) {
        console.error("Order creation failed critical error:", error);
        res.status(500).json({ message: "Internal server error while creating order" });
    }
});

// Update order status (for distributor)
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findOne({ id: String(id) });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const oldStatus = order.status;
        order.status = status;

        // Save to MongoDB
        await order.save();
        console.log(`Order ${id} status updated in MongoDB to ${status}.`);

        // Update backup in Firebase
        setDoc(doc(collection(firestore, 'orders'), String(id)), { status: status }, { merge: true })
            .then(() => console.log(`Order ${id} status updated in Firebase backup.`))
            .catch(fbError => console.error('Error updating order status in Firebase:', fbError));

        // Trigger real-time notification via Socket.IO
        if (req.io && oldStatus !== status) {
            console.log(`Emitting status update for order ${id}: ${oldStatus} -> ${status} (For User: ${order.userId})`);
            req.io.emit('order_status_updated', {
                orderId: order.id,
                userId: String(order.userId),
                status: status
            });
        }

        const formattedOrder = order.toObject();
        delete formattedOrder._id;
        delete formattedOrder.__v;

        res.json(formattedOrder);
    } catch (error) {
        console.error("Failed to update order status:", error);
        res.status(500).json({ message: "Internal server error while updating order status" });
    }
});

module.exports = router;
