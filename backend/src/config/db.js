const mongoose = require('mongoose');

const connectDB = async () => {
	const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

	if (!MONGODB_URI) {
		throw new Error('MONGODB_URI is not defined in the environment.');
	}

	return mongoose.connect(MONGODB_URI);
};

module.exports = connectDB;
