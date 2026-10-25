const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // We tell Mongoose to connect using the secret URL from our .env file
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Database connection failed: ${error.message}`);
        process.exit(1); // If the database fails, we kill the server so it doesn't run broken
    }
};

module.exports = connectDB; // Export this function so server.js can use it