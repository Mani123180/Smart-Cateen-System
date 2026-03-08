const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String },
    description: { type: String },
    stock: { type: Number, default: 0 },
    meals: [{ type: String }] // e.g., ["Breakfast", "Lunch", "Snacks", "Dinner"]
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
