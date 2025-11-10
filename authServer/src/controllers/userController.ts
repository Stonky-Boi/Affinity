import { Response, Request } from "express";
import { prisma } from "../lib/prisma.ts";

export const follow = async (req: Request, res: Response) => {
	const followerId = req.user!.userId;

	const followingId = req.params.id;

	console.log(followingId);

	try {
		const existingFollow = await prisma.follows.findUnique({
			where: {
				follower_id_following_id: { follower_id: followerId, following_id: parseInt(followingId) },
			},
		});

		if (existingFollow) {
			await prisma.follows.delete({
				where: {
					follower_id_following_id: { follower_id: followerId, following_id: parseInt(followingId) },
				}
			});
			return res.status(204).json({ message: "Unfollowed User" });
		} else {
			await prisma.follows.create({
				data: { follower_id: followerId, following_id: parseInt(followingId) },
			});
			return res.status(201).json({ message: "Followed User" });
		}
	}
	catch (error) {
		res.status(500).json({ error });
	}
}

export const getFollowers = async (req: Request, res: Response) => {
	const userId = parseInt(req.params.id);

	try {
		const followers = await prisma.follows.findMany({
			where: { following_id: userId },
			include: { follower: true }
		});
		return res.status(200).json(followers);
	}
	catch (error) {
		res.status(500).json({ error });
	}
}

export const getFollowing = async (req: Request, res: Response) => {
	const userId = parseInt(req.params.id);

	try {
		const followings = await prisma.follows.findMany({
			where: { follower_id: userId },
			include: { following: true }
		});
		return res.status(200).json(followings);
	}
	catch (error) {
		res.status(500).json({ error });
	}
}

export const getUsers = async (req: Request, res: Response) => {
	try {
		const users = await prisma.user.findMany();
		res.status(200).json(users);
	} catch (error) {
		res.status(500).json({ error: error });
	}
}

export const searchUsers = async (req: Request, res: Response) => {
	const q = req.query.q as string;

	if (!q) {
		return res.status(400).json({ error: "Empty Request" });
	}

	try {
		const users = await prisma.user.findMany({
			where: {
				username: {
					contains: q,
					mode: 'insensitive',
				},
			},
		});
		res.status(200).json(users);
	} catch (error) {
		res.status(500).json({ error: error })
	}
}

export const getMutuals = async (req: Request, res: Response) => {
	const currentUserId = req.user?.userId;

	try {

		const followingResult = await prisma.follows.findMany({
			where: { follower_id: currentUserId },
			select: { following_id: true }
		});

		const followingIds = followingResult.map(f => f.following_id);

		const mutualResults = await prisma.follows.findMany({
			where: {
				following_id: currentUserId,
				follower_id: { in: followingIds }
			},
			include: { follower: true }
		});

		const mutualUsers = mutualResults.map(m => m.follower);
		res.status(200).json(mutualUsers);

	} catch (error) {
		res.status(500).json({ error: error });
	}
}
