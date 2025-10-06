import express from 'express';
import type { Express, Request, Response } from 'express';

import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './middleware/auth.js';


// Initialize Express app and Prisma Client
const app: Express = express();
const prisma = new PrismaClient();
const PORT: number | string = process.env.PORT || 3000;

// ---- MIDDLEWARE ----
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Allows parsing of JSON request bodies

// ---- API ROUTES ----

// Define a type for the expected request body
interface UserSubmitBody {
	username?: string;
	emailId?: string;
	password?: string;
}

interface LoginSubmitBody {
	emailId?: string;
	password?: string;
}


app.post('/api/register', async (req: Request, res: Response) => {
	// Use the type for the request body
	const { username, emailId, password } = req.body as UserSubmitBody;

	if (!username || !password || !emailId) {
		return res.status(400).json({ error: 'Username and password and Email are required.' });
	}
	const saltRounds = 10;
	const hashedPassword = await bcrypt.hash(password, saltRounds);
	// WARNING: In a real app, hash passwords!
	try {
		// Prisma's client is fully typed, so `data` is automatically checked!
		const newUser = await prisma.user.create({
			data: {
				username: username,
				email: emailId,
				password: hashedPassword,
			},
		});
		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			console.error("JWT_SECRET is not defined in the environment variables.");
			return res.status(500).json({ error: "Internal server error: Server configuration issue." });
		}

		// 4. Generate a JWT
		const token = jwt.sign(
			{ userId: newUser.id, email: newUser.email }, // Payload: Don't include sensitive data
			jwtSecret,
			{ expiresIn: '1h' } // Token expiration
		);

		// 5. Send the token to the client
		return res.status(200).json({ token });

	} catch (error: any) { // Catch block variable must be of type 'any' or 'unknown'
		if (error?.code === 'P2002') { // Prisma error code for unique constraint violation
			return res.status(409).json({ error: `Username "${username}" already exists.` });
		}
		console.error(error);
		return res.status(500).json({ error: 'An error occurred while creating the user.' });
	}
});


app.post('/api/login', async (req: Request, res: Response) => {
	try {
		const { emailId, password } = req.body as LoginSubmitBody;

		if (!password || !emailId) {
			return res.status(400).json({ error: 'Password and Email are required.' });
		}

		// 1. Find the user by email
		const user = await prisma.user.findUnique({
			where: { email: emailId },
		});

		if (!user) {
			// Use a generic message to avoid revealing if an email is registered
			return res.status(401).json({ error: "Invalid credentials." });
		}

		// 2. Compare the provided password with the stored hash
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return res.status(401).json({ error: "Invalid credentials." });
		}

		// 3. Check for JWT_SECRET
		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			console.error("JWT_SECRET is not defined in the environment variables.");
			return res.status(500).json({ error: "Internal server error: Server configuration issue." });
		}

		// 4. Generate a JWT
		const token = jwt.sign(
			{ userId: user.id, email: user.email }, // Payload: Don't include sensitive data
			jwtSecret,
			{ expiresIn: '1h' } // Token expiration
		);

		// 5. Send the token to the client
		return res.status(200).json({ token });

	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}
});


app.get('/api/profile', authenticateToken, async (req: Request, res: Response) => {
	try {
		// The user ID is now attached to the request object by the middleware
		const userId = req.user!.userId;
		console.log("hello");
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { // Use 'select' to only fetch the fields you need
				id: true,
				email: true,
				username: true,
				createdAt: true
			}
		});

		if (!user) {
			return res.status(404).json({ error: "User not found." });
		}

		res.json(user);
	} catch (error) {
		res.status(500).json({ error: "Internal server error." });
	}
});






// ---- PRODUCTION SETUP ----
if (process.env.NODE_ENV === 'production') {
	const frontendDistPath = path.join(__dirname, '../../frontend/dist');
	app.use(express.static(frontendDistPath));
	app.get('*', (req: Request, res: Response) => {
		res.sendFile(path.join(frontendDistPath, 'index.html'));
	});
}

// ---- START SERVER ----
app.listen(PORT, () => {
	console.log(`Backend server is running on http://localhost:${PORT}`);
});
