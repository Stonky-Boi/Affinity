import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

export const getProfileById = async (req: Request, res: Response) => {
	try {
		const userId = req.user!.userId;
		console.log("hello");
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
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
}
