const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // e.g., SAM-20260214-03
    userId: { type: String, required: true },
    items: [OrderItemSchema],
    total: { type: Number, required: true },
    status: { type: String, default: 'Pending' }, // e.g., Pending, Served
    date: { type: Date, default: Date.now },
    paymentMode: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
