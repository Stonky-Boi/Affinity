import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { JsonValue } from "@prisma/client/runtime/library";

interface profileInfoBody{
	id? : Number;
	username? : string;
	email? : string;
	first_name: string | null;
	last_name: string | null;
	bio: string | null;
	date_of_birth: Date | null;
	country: string | null;
	state: string | null;
	city: string | null;
	phone: string | null;
	alternate_email: string | null;
	privacy_settings: JsonValue | null;
};

export const getProfileById = async (req: Request, res: Response) => {
	try {
		const userId = req.user!.userId;
		console.log("hello");
		const user: profileInfoBody | null = await prisma.user.findUnique({
    where: { id: userId },
    select: {
				id: true,
        username: true,
        email: true,
        first_name: true,      // Make sure these names match your prisma.schema
        last_name: true,
        bio: true,
        date_of_birth: true,
        country: true,
        state: true,
        city: true,
        phone: true,
        alternate_email: true,
        privacy_settings: true,
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

export const setProfileById = async (req: Request, res: Response) => {
	
}
