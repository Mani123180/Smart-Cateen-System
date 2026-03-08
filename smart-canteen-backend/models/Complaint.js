const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // e.g., COMP-1770914349398
    name: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String },
    message: { type: String, required: true },
    photo: { type: String }, // Base64 or image URL
    status: { type: String, default: 'Open' },
    reply: { type: String },
    adminReply: { type: String },
    userId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
