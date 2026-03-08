const { db } = require('./utils/firebase');
const { collection, setDoc, doc } = require('firebase/firestore');
const localDb = require('./utils/db');

async function migrateData() {
    console.log('Starting migration to Firebase Firestore...');

    try {
        // Migrate Users
        console.log('Migrating Users...');
        const users = localDb.users.getAll();
        for (const user of users) {
            await setDoc(doc(collection(db, 'users'), String(user.id)), user);
        }
        console.log(`Successfully migrated ${users.length} users.`);

        // Migrate Products
        console.log('Migrating Products...');
        const products = localDb.products.getAll();
        for (const product of products) {
            await setDoc(doc(collection(db, 'products'), String(product.id)), product);
        }
        console.log(`Successfully migrated ${products.length} products.`);

        // Migrate Orders
        console.log('Migrating Orders...');
        const orders = localDb.orders.getAll();
        for (const order of orders) {
            await setDoc(doc(collection(db, 'orders'), String(order.id)), order);
        }
        console.log(`Successfully migrated ${orders.length} orders.`);

        // Migrate Complaints 
        console.log('Migrating Complaints...');
        const complaints = localDb.complaints.getAll();
        for (const complaint of complaints) {
            await setDoc(doc(collection(db, 'complaints'), String(complaint.id)), complaint);
        }
        console.log(`Successfully migrated ${complaints.length} complaints.`);

        // Migrate Settings
        console.log('Migrating Settings...');
        const settings = localDb.settings.get();
        await setDoc(doc(collection(db, 'config'), 'settings'), settings);
        console.log(`Successfully migrated settings.`);

        console.log('\n--- Migration Complete! ---');
        console.log('Your Firestore database now has all your local data.');
        process.exit();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateData();
