import { Response, Request } from "express";
import { prisma } from "../lib/prisma.ts";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface UserSubmitBody {
	username?: string;
	email?: string;
	password?: string;
}

interface LoginSubmitBody {
	email?: string;
	password?: string;
}


export const signup = async (req: Request, res: Response) => {
	const { username, email, password } = req.body as UserSubmitBody;

	if (!username || !password || !email) {
		return res.status(400).json({ error: 'Username and password and Email are required.' });
	}
	try {
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		const newUser = await prisma.user.create({
			data: {
				username : username,
				email : email,
				password : hashedPassword
			}
		})
		console.info(newUser);

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			console.error("JWT_SECRET is not defined in the environment variables.");
			return res.status(500).json({ error: "Internal server error: Server configuration issue." });
		}

		const token = jwt.sign(
			{ userId: newUser.id, email: newUser.email },
			jwtSecret,
			{ expiresIn: '1h' }
		);

		return res.status(201).json({ message : "User created succesfully!",token });

	} catch (error: any) {
		if (error?.code === 'P2002') {
			const target = error.meta?.target;
			if (Array.isArray(target)) {
				if (target.includes('username')) {
					console.error('Username already exists.');
					return res.status(409).json({ error: `Username "${username}" already exists.` });
				}

				if (target.includes('email')) {
					console.error('Email ID already exists.');
					return res.status(409).json({ error: `EmailId "${email}" already exists.` });

				}
			}
		}
		console.error(error);
		return res.status(500).json({ error: 'An error occurred while creating the user.' });
	}
}

export const login = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body as LoginSubmitBody;

		if (!password || !email) {
			return res.status(400).json({ error: 'Password and Email are required.' });
		}

		const user = await prisma.user.findUnique({
			where: { email: email },
		});

		if (!user) {
			return res.status(401).json({ error: "Invalid credentials." });
		}


		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return res.status(401).json({ error: "Invalid credentials." });
		}


		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			console.error("JWT_SECRET is not defined in the environment variables.");
			return res.status(500).json({ error: "Internal server error: Server configuration issue." });
		}


		const token = jwt.sign(
			{ userId: user.id, email: user.email },
			jwtSecret,
			{ expiresIn: '1h' }
		);


		return res.status(200).json({ token });

	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}

}
