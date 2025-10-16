import { Response, Request } from "express";
import { prisma } from "../lib/prisma.ts";

interface PostBody {
	content?: string;
}

export const createPost = async (req: Request, res: Response) => {
	const authorId = req.user!.userId;
	const { content } = req.body as PostBody;

	if (!content) {
		return res.status(400).json({ error: 'No content in the post' });
	}

	try {
		const newPost = await prisma.post.create({
			data: {
				content,
				author_id: authorId
			}
		})

		res.status(201).json({ message: "Successfully created post", content: newPost })
	}
	catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}

}

export const getPosts = async (req: Request, res: Response) => {
	try {
		const posts = await prisma.post.findMany({
			include: { author: true },
		});
		res.status(200).json(posts);
	}
	catch (error) {
		res.status(500).json({ error});
	}
}

export const makeCommentOnPost = async (req: Request, res: Response) => {
	const { postId } = req.params;
	const { content, author_id } = req.body;

	try {
		const newComment = await prisma.comment.create({
			data: {
				content,
				author_id,
				post_id: parseInt(postId)
			}
		});

		res.status(201).json(newComment);
	} catch (error) {
		res.status(500).json({ error});
	}
}

export const getCommentsOnPost = async (req: Request, res: Response) => {
	const { postId } = req.params;
	try {
		const comments = await prisma.comment.findMany({
			where: { post_id: parseInt(postId) },
			include: { author: true },
		});
		res.status(200).json(comments);
	} catch (error) {
		res.status(500).json({ error });
	}
}

export const makeReactionOnPost = async (req: Request, res: Response) => {
	const { postId } = req.params;
	const user_id = req.user!.userId;

	try {
		const reaction = await prisma.reaction.findUnique({
			where: {
				user_id_post_id: {
					user_id: user_id,
					post_id: parseInt(postId),
				},
			},
		});

		if(reaction){
			await prisma.reaction.delete({where: {id: reaction.id}});
			res.status(204).json({message : "Reaction successfully made"});
		}

	} catch (error) {
		res.status(500).json({ error})
	}
}

export const getReactions = async (req: Request, res: Response) => {
	const { postId } = req.params;
	try {
		const reactions = await prisma.reaction.findMany({
			where: { post_id: parseInt(postId) },
		});
		res.status(200).json(reactions);
	} catch (error) {
		res.json({ error: 'Unable to fetch reactions' });
	}
}
