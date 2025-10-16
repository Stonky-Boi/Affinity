import { Response, Request } from "express";
import { prisma } from "../lib/prisma.ts";

export const follow = async (req: Request, res: Response) => {
	const followerId = req.user!.userId;

	const followingId  = req.params.id;

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
				data: { follower_id: followerId, following_id : parseInt(followingId)},
			});
			return res.status(201).json({ message: "Followed User" });
		}
	}
	catch (error) {
		res.status(500).json({error});
	}
}

export const getFollowers = async (req : Request, res : Response) => {
	const userId = parseInt(req.params.id);

	try{
		const followers = await prisma.follows.findMany({
			where : { following_id: userId},
			include : { follower: true}
		});
		return res.status(200).json(followers);
	}
	catch (error) {
		res.status(500).json({error});
	}
}

export const getFollowing = async (req : Request, res : Response) => {
	const userId = parseInt(req.params.id);

	try{
		const followings = await prisma.follows.findMany({
			where : { follower_id: userId},
			include : { following: true}
		});
		return res.status(200).json(followings);
	}
	catch (error) {
		res.status(500).json({error});
	}
}
