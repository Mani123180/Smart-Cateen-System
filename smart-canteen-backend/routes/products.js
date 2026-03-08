const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({}, '-_id'); // Exclude MongoDB _id, use our custom 'id'
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new product
router.post('/', async (req, res) => {
    const { name, price, category, image, stock, description, meals } = req.body;

    if (!name || price === undefined || !category) {
        return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    try {
        // Generate sequential custom ID
        const lastProduct = await Product.findOne().sort('-id');
        const newId = lastProduct && lastProduct.id ? lastProduct.id + 1 : 1;

        const newProduct = new Product({
            id: newId,
            name,
            price: parseFloat(price),
            category,
            image: image || '',
            stock: parseInt(stock) || 0,
            description: description || '',
            meals: meals || []
        });

        await newProduct.save();

        // Return object without _id to match frontend expectations
        const productData = newProduct.toObject();
        delete productData._id;

        res.status(201).json(productData);
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ message: 'Server error while creating product' });
    }
});

// Update a product
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, category, image, stock, description, meals } = req.body;

    try {
        const product = await Product.findOne({ id: Number(id) });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (name) product.name = name;
        if (price !== undefined) product.price = parseFloat(price);
        if (category) product.category = category;
        if (image !== undefined) product.image = image;
        if (stock !== undefined) product.stock = parseInt(stock);
        if (description !== undefined) product.description = description;
        if (meals !== undefined) product.meals = meals;

        await product.save();

        const productData = product.toObject();
        delete productData._id;

        res.json(productData);
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ message: 'Server error while updating product' });
    }
});

// Update stock only (existing route, kept for compatibility)
router.patch('/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;

    try {
        const product = await Product.findOneAndUpdate(
            { id: Number(id) },
            { stock: parseInt(stock) },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const productData = product.toObject();
        delete productData._id;

        res.json(productData);
    } catch (err) {
        console.error('Error updating product stock:', err);
        res.status(500).json({ message: 'Server error while updating product stock' });
    }
});

// Delete a product
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Product.deleteOne({ id: Number(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ message: 'Server error while deleting product' });
    }
});

module.exports = router;
