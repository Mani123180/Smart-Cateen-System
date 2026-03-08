const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    breakfast: { type: Boolean, default: true },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    snacks: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);
