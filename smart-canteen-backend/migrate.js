require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import Models
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Complaint = require('./models/Complaint');
const Setting = require('./models/Setting');

// File Paths
const dataDir = path.join(__dirname, 'data');

// Read JSON Helper
const readData = (filename) => {
    try {
        const filePath = path.join(dataDir, filename);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error reading ${filename}:`, error.message);
    }
    return [];
};

const migrateData = async () => {
    try {
        if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<db_password>')) {
             console.error("\n❌ ERROR: Invalid MONGO_URI.");
             console.error("Please ensure you have replaced <db_password> with your actual password in the .env file.");
             process.exit(1);
        }

        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected successfully!');

        // 1. Migrate Users
        console.log('Migrating Users...');
        const users = readData('users.json');
        if (users.length > 0) {
            await User.deleteMany({}); // Clear existing to avoid duplicates
            await User.insertMany(users);
            console.log(`✅ Migrated ${users.length} users.`);
        }

        // 2. Migrate Products
        console.log('Migrating Products...');
        const products = readData('products.json');
        if (products.length > 0) {
            await Product.deleteMany({});
            await Product.insertMany(products);
            console.log(`✅ Migrated ${products.length} products.`);
        }

        // 3. Migrate Orders
        console.log('Migrating Orders...');
        const orders = readData('orders.json');
        if (orders.length > 0) {
            await Order.deleteMany({});
            await Order.insertMany(orders);
            console.log(`✅ Migrated ${orders.length} orders.`);
        }

        // 4. Migrate Complaints
        console.log('Migrating Complaints...');
        const complaints = readData('complaints.json');
        if (complaints.length > 0) {
             await Complaint.deleteMany({});
             await Complaint.insertMany(complaints);
             console.log(`✅ Migrated ${complaints.length} complaints.`);
        }

        // 5. Migrate Settings
        console.log('Migrating Settings...');
        const settings = readData('settings.json');
        if (settings && Object.keys(settings).length > 0) {
            await Setting.deleteMany({});
            await Setting.create(settings);
            console.log(`✅ Migrated settings.`);
        }

        console.log('\n🎉 All JSON data successfully migrated to MongoDB Atlas!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration Failed:', error.message);
        process.exit(1);
    }
};

migrateData();
