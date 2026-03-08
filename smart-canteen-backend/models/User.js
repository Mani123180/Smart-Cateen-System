const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'student', enum: ['student', 'admin', 'distributor'] },
    balance: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Number },
    otpAttempts: { type: Number, default: 0 },
    lastOtpResend: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
}, { timestamps: true });

// Using 'id' for custom identifiers from the legacy JSON, 
// though MongoDB will also automatically create an '_id' field.
module.exports = mongoose.model('User', UserSchema);
