import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getBlockedUserIds } from '../services/block.service';
import prisma from '../db';

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        await prisma.user.update({
            where: { id: userId },
            data: {
                deleted_at: new Date(),
                email: null,
                username: `deleted_user_${userId}`
            },
        });

        res.json({ message: 'Account successfully deleted.' });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: 'Failed to delete account.' });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    const currentUserId = (req as AuthRequest).user?.userId;
    let blockedUserIds: number[] = [];
    if (currentUserId) {
        blockedUserIds = await getBlockedUserIds(currentUserId);
    }
    try {
        const users = await prisma.user.findMany({
            where: {
                id: { notIn: blockedUserIds }
            }
        });
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: 'Unable to fetch users' });
    }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
    const currentUserId = req.user!.userId;
    const { q } = req.query;
    if (!q) {
        return res.json([]);
    }
    try {
        const blockedUserIds = await getBlockedUserIds(currentUserId);
        const users = await prisma.user.findMany({
            where: {
                username: {
                    contains: q as string,
                    mode: 'insensitive',
                },
                id: { notIn: blockedUserIds }
            },
        });
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: 'Unable to perform search.' });
    }
};

export const getMutuals = async (req: AuthRequest, res: Response) => {
    const currentUserId = req.user!.userId;
    try {
        const blockedUserIds = await getBlockedUserIds(currentUserId);
        const followingResult = await prisma.follows.findMany({
            where: {
                follower_id: currentUserId,
                following_id: { notIn: blockedUserIds }
            },
            select: { following_id: true }
        });
        const followingIds = followingResult.map((f: any) => f.following_id);
        const mutualsResult = await prisma.follows.findMany({
            where: {
                following_id: currentUserId,
                follower_id: { in: followingIds }
            },
            include: { follower: true }
        });
        const mutualUsers = mutualsResult.map((m: any) => m.follower);
        res.json(mutualUsers);
    } catch (error: any) {
        res.status(500).json({ error: "Unable to fetch mutuals." });
    }
};

export const getMutualsWithViewer = async (req: AuthRequest, res: Response) => {
    const viewerId = req.user!.userId;
    const profileUsername = req.params.username;
    try {
        const profileUser = await prisma.user.findUnique({
            where: { username: profileUsername },
            select: { id: true }
        });
        if (!profileUser) return res.status(404).json({ error: 'Profile user not found.' });
        const profileUserId = profileUser.id;
        const viewerFollowingResult = await prisma.follows.findMany({
            where: { follower_id: viewerId, status: 'accepted' },
            select: { following_id: true }
        });
        const viewerFollowingIds = new Set(viewerFollowingResult.map((f: any) => f.following_id));
        const profileFollowingResult = await prisma.follows.findMany({
            where: { follower_id: profileUserId, status: 'accepted' },
            select: { following_id: true }
        });
        const profileFollowingIds = new Set(profileFollowingResult.map((f: any) => f.following_id));
        const mutualFollowingIds = [...viewerFollowingIds].filter(id => profileFollowingIds.has(id));
        const mutualUsers = await prisma.user.findMany({
            where: { id: { in: mutualFollowingIds } },
            select: { id: true, username: true, picture_url: true }
        });
        res.json(mutualUsers);
    } catch (error: any) {
        console.error("Error fetching mutuals with viewer:", error);
        res.status(500).json({ error: "Unable to fetch mutual connections." });
    }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
    const { username } = req.params;
    const viewerId = req.user!.userId;
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                first_name: true,
                last_name: true,
                picture_url: true,
                bio: true,
                created_at: true,
                privacy_settings: true,
                posts: {
                    where: { deleted_at: null },
                    orderBy: { created_at: 'desc' },
                    include: { author: true }
                },
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        const block = await prisma.block.findFirst({
            where: {
                OR: [
                    { blocker_id: viewerId, blocked_id: user.id },
                    { blocker_id: user.id, blocked_id: viewerId },
                ]
            }
        });
        if (block) {
            return res.status(403).json({ error: 'You cannot view this profile.' });
        }
        const isPrivate = (user.privacy_settings as any)?.is_private === true;
        let isFollowing = false;
        if (viewerId) {
            if (viewerId === user.id) {
                isFollowing = true;
            } else {
                const followStatus = await prisma.follows.findUnique({
                    where: {
                        follower_id_following_id: { follower_id: viewerId, following_id: user.id }
                    },
                    select: { status: true }
                });
                isFollowing = followStatus?.status === 'accepted';
            }
        }
        if (isPrivate && !isFollowing) {
            res.json({
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                picture_url: user.picture_url,
                bio: user.bio,
                is_private: true,
                posts: []
            });
        } else {
            res.json(user);
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Unable to fetch user profile.' });
    }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const {
        first_name, last_name, bio, picture_url, date_of_birth,
        country, state, city, phone, alternate_email, privacy_settings
    } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const newPrivacySettings = { ...user?.privacy_settings as object, ...privacy_settings };
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                first_name: first_name,
                last_name: last_name || null,
                bio: bio || null,
                picture_url: picture_url || null,
                date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
                country: country || null,
                state: state || null,
                city: city || null,
                phone: phone || null,
                alternate_email: alternate_email || null,
                privacy_settings: newPrivacySettings
            },
        });
        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "Alternate email is already in use." });
        }
        res.status(500).json({ error: "Unable to update profile." });
    }
};

export const getFollowers = async (req: AuthRequest, res: Response) => {
    const currentUserId = req.user!.userId;
    try {
        const user_id = parseInt(req.params.id);
        const blockedUserIds = await getBlockedUserIds(currentUserId);
        const followers = await prisma.follows.findMany({
            where: {
                following_id: user_id,
                status: 'accepted',
                follower_id: { notIn: blockedUserIds }
            },
            include: { follower: true },
        });
        res.json(followers);
    } catch (error: any) {
        res.json({ error: 'Unable to fetch followers' });
    }
};

export const getFollowing = async (req: AuthRequest, res: Response) => {
    const currentUserId = req.user!.userId;
    try {
        const user_id = parseInt(req.params.id);
        const blockedUserIds = await getBlockedUserIds(currentUserId);
        const following = await prisma.follows.findMany({
            where: {
                follower_id: user_id,
                following_id: { notIn: blockedUserIds }
            },
            include: { following: true },
        });
        res.json(following);
    } catch (error: any) {
        res.status(500).json({ error: 'Error fetching following list.' });
    }
};