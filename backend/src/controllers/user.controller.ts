import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getFriendshipScore } from '../services/friendship.service';
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

export const getSuggestedUsers = async (req: AuthRequest, res: Response) => {
    const currentUserId = req.user!.userId;
    const SUGGESTION_LIMIT = 10;
    try {
        const following = await prisma.follows.findMany({
            where: { follower_id: currentUserId, status: 'accepted' },
            select: { following_id: true }
        });
        const followingIds = new Set(following.map(f => f.following_id));
        followingIds.add(currentUserId);
        const blockedUserIds = await getBlockedUserIds(currentUserId);
        const blockedIdsSet = new Set(blockedUserIds);
        const friendsOfFriends = await prisma.follows.findMany({
            where: {
                follower_id: { in: Array.from(followingIds) },
                status: 'accepted',
                following_id: { notIn: Array.from(followingIds) },
            },
            select: {
                follower_id: true,
                following_id: true,
            }
        });
        const suggestionScores = new Map<number, number>();
        for (const fof of friendsOfFriends) {
            const suggestionId = fof.following_id;
            const mutualFriendId = fof.follower_id;
            if (blockedIdsSet.has(suggestionId)) {
                continue;
            }
            const score = await getFriendshipScore(suggestionId, mutualFriendId);
            const currentScore = suggestionScores.get(suggestionId) || 0;
            suggestionScores.set(suggestionId, currentScore + score);
        }
        const sortedSuggestions = Array.from(suggestionScores.entries()).sort(
            (a, b) => b[1] - a[1]
        );
        const topSuggestionIds = sortedSuggestions
            .slice(0, SUGGESTION_LIMIT)
            .map(entry => entry[0]);
        const userMap = new Map((await prisma.user.findMany({
            where: { id: { in: topSuggestionIds } },
            select: {
                id: true,
                username: true,
                picture_url: true,
                first_name: true,
                last_name: true
            }
        })).map(u => [u.id, u]));
        const finalSortedUsers = topSuggestionIds
            .map(id => userMap.get(id))
            .filter(user => user != null);
        const needed = SUGGESTION_LIMIT - finalSortedUsers.length;
        if (needed > 0) {
            const exclusionIds = new Set([
                ...Array.from(followingIds),
                ...Array.from(blockedIdsSet),
                ...topSuggestionIds
            ]);
            const fillerUsers = await prisma.user.findMany({
                where: {
                    id: { notIn: Array.from(exclusionIds) }
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: needed,
                select: {
                    id: true,
                    username: true,
                    picture_url: true,
                    first_name: true,
                    last_name: true
                }
            });
            const combinedUsers = [...finalSortedUsers, ...fillerUsers];
            return res.json(combinedUsers);
        }
        res.json(finalSortedUsers);
    } catch (error: any) {
        console.error("Error fetching suggestions:", error);
        res.status(500).json({ error: 'Unable to fetch suggestions.' });
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

export const getMutualsWithScore = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { username } = req.params;
        const profileUser = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });
        if (!profileUser) return res.status(404).json({ error: "User not found" });
        const viewerFollowing = await prisma.follows.findMany({
            where: { follower_id: currentUserId, status: 'accepted' },
            select: { following_id: true }
        });
        const viewerFollowingIds = new Set(viewerFollowing.map(f => f.following_id));
        const profileFollowing = await prisma.follows.findMany({
            where: { follower_id: profileUser.id, status: 'accepted' },
            select: { following_id: true }
        });
        const mutuals = await prisma.user.findMany({
            where: {
                id: {
                    in: profileFollowing.map(f => f.following_id)
                        .filter(id => viewerFollowingIds.has(id))
                }
            },
            select: { id: true, username: true, picture_url: true }
        });
        const mutualsWithScore = await Promise.all(mutuals.map(async (mutual) => {
            const score = await getFriendshipScore(currentUserId, mutual.id);
            return { ...mutual, score };
        }));
        mutualsWithScore.sort((a, b) => b.score - a.score);
        res.json(mutualsWithScore);
    } catch (error: any) {
        res.status(500).json({ error: "Could not fetch mutuals." });
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
                settings: true,
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
        const isPrivate = user.settings?.is_private === true;
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
                settings: { is_private: true },
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
        first_name, last_name, bio, picture_url, date_of_birth, phone, alternate_email, privacy_settings
    } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                first_name: first_name,
                last_name: last_name || null,
                bio: bio || null,
                picture_url: picture_url || null,
                date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
                phone: phone || null,
                alternate_email: alternate_email || null,
                settings: {
                    upsert: {
                        create: { is_private: (privacy_settings as any)?.is_private || false },
                        update: { is_private: (privacy_settings as any)?.is_private }
                    }
                }
            },
            include: { settings: true }
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
        res.status(500).json({ error: 'Unable to fetch followers' });
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