const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuRoutes = require('./routes/menuRoutes');
const Restaurant = require('./models/Restaurant');
const DeliveryPartner = require('./models/DeliveryPartner');
const deliveryRoutes = require('./routes/deliveryRoutes');
const adminDeliveryRoutes = require('./routes/adminDeliveryRoutes');
const { expireTimedOutOffers, updateLocation } = require('./services/deliveryService');

const app = express();
const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
	.split(',').map((origin) => origin.trim());

app.use(cors({
	origin: frontendOrigins,
	credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin', adminDeliveryRoutes);
app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use(errorHandler);

async function startServer() {
	try {
		await connectDB();
		console.log("Database connected successfully.");
	} catch (error) {
		console.error("Unable to connect to the database:", error.message);
	}
	
	const port = Number(process.env.PORT) || 5000;
	const server = http.createServer(app);
	const io = new Server(server, {
		cors: {
			origin: frontendOrigins,
			credentials: true,
		},
	});
	io.use((socket, next) => {
		try {
			const token = socket.handshake.auth?.token;
			if (!token || !process.env.JWT_SECRET) return next(new Error('Authentication required.'));
			socket.data.user = jwt.verify(token, process.env.JWT_SECRET);
			return next();
		} catch {
			return next(new Error('Invalid or expired token.'));
		}
	});
	io.on('connection', async (socket) => {
		const userId = socket.data.user.id || socket.data.user.userId || socket.data.user.sub;
		if (!userId) return socket.disconnect(true);
		socket.join(`user:${userId}`);
		if (socket.data.user.role === 'RESTAURANT' || socket.data.user.role === 'ADMIN') {
			const restaurants = await Restaurant.find({ ownerId: userId }).select('_id');
			for (const restaurant of restaurants) socket.join(`restaurant:${restaurant._id}`);
		}
		socket.on('delivery:location', async (payload = {}, acknowledge) => {
			const reply = typeof acknowledge === 'function' ? acknowledge : () => {};
			if (socket.data.user.role !== 'DELIVERY_PARTNER') {
				return reply({ ok: false, message: 'Only delivery partners can send GPS updates.' });
			}
			const latitude = Number(payload.latitude);
			const longitude = Number(payload.longitude);
			if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
				return reply({ ok: false, message: 'GPS coordinates are invalid.' });
			}
			try {
				const partner = await DeliveryPartner.findOne({
					userId,
					isVerified: true,
					verificationStatus: 'APPROVED',
					isOnline: true,
				}).select('_id');
				if (!partner) return reply({ ok: false, message: 'An approved online profile is required to share live location.' });
				const location = await updateLocation(userId, [longitude, latitude], io);
				return reply({ ok: true, latitude: location.coordinates[1], longitude: location.coordinates[0] });
			} catch (error) {
				return reply({ ok: false, message: 'Unable to update delivery location.' });
			}
		});
	});
	app.set('io', io);
	const offerReaper = setInterval(() => {
		expireTimedOutOffers(io).catch((error) => console.error('Delivery offer timeout failed:', error.message));
	}, 10000);
	offerReaper.unref?.();
	return server.listen(port, () => console.log(`Backend listening on port ${port}`));
}

if (require.main === module) {
	startServer().catch((error) => {
		console.error('Unable to start backend:', error.message);
		process.exitCode = 1;
	});
}

module.exports = { app, startServer };
