import express = require('express');
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { authenticateToken } = require('./middleware/auth');
import { AuthRequest } from './middleware/auth';
const { updateFriendship } = require('./FriendshipLogic');

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  }
});

require('dotenv').config();
const port: number = 3000;
app.use(cors());
app.use(express.json());

app.get('/users', async (req: express.Request, res: express.Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch users' });
  }
});

app.get('/users/search', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  const { q } = req.query;
  if (!q) {
    return res.json([]);
  }
  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: q as string,
          mode: 'insensitive',
        },
      },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to perform search.' });
  }
});

app.get('/users/mutuals', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  const currentUserId = req.user!.userId;
  try {
    const followingResult = await prisma.follows.findMany({
      where: { follower_id: currentUserId },
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
});

app.get('/users/:username/mutuals-with-viewer', authenticateToken, async (req: AuthRequest, res: express.Response) => {
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
});

app.get('/users/:username', async (req: express.Request, res: express.Response) => {
  const { username } = req.params;
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
        posts: {
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
          include: { author: true }
        },
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch user profile.' });
  }
});

app.patch('/users/profile', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  const userId = req.user!.userId;
  const {
    first_name,
    last_name,
    bio,
    picture_url,
    date_of_birth,
    country,
    state,
    city,
    phone,
    alternate_email
  } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        first_name,
        last_name,
        bio,
        picture_url,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        country,
        state,
        city,
        phone,
        alternate_email
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
});

app.post('/auth/signup', async (req: express.Request, res: express.Response) => {
  try {
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });
    res.json(newUser);
  } catch (error: any) {
    res.status(400).json({ error: 'User with this email or username already exists.' });
  }
});

app.post('/auth/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password.' });
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );
    res.json({ message: 'Login successful!', token, user });
  } catch (error: any) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

app.post('/posts', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  const author_id = req.user!.userId;
  const { content } = req.body;
  try {
    const newPost = await prisma.post.create({
      data: { content, author_id },
    });
    res.json(newPost);
  } catch (error: any) {
    res.json({ error: `Unable to create post` });
  }
});

app.get('/posts', async (req: express.Request, res: express.Response) => {
  try {
    const posts = await prisma.post.findMany({
      where: { deleted_at: null },
      include: { author: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ error: `Unable to fetch posts` });
  }
});

app.get('/feed', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  const currentUserId = req.user!.userId;
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user_a_id: currentUserId },
          { user_b_id: currentUserId },
        ],
      },
    });
    const friendshipScores = new Map<number, number>();
    friendships.forEach((f: any) => {
      const otherUserId = f.user_a_id === currentUserId ? f.user_b_id : f.user_a_id;
      friendshipScores.set(otherUserId, f.friend_score || 0);
    });

    const allPosts = await prisma.post.findMany({
      where: {
        deleted_at: null,
      },
      include: { author: true },
      orderBy: { created_at: 'desc' }, 
    });

    allPosts.sort((postA: any, postB: any) => {
      const dateA = postA.created_at.toISOString().split('T')[0];
      const dateB = postB.created_at.toISOString().split('T')[0];

      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;

      const getPostScore = (post: any) => {
        if (post.author_id === currentUserId) {
          return Infinity;
        }
        return friendshipScores.get(post.author_id) || 0; 
      };

      const scoreA = getPostScore(postA);
      const scoreB = getPostScore(postB);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      const timeA = new Date(postA.created_at).getTime();
      const timeB = new Date(postB.created_at).getTime();
      
      return timeB - timeA;
    });

    res.json(allPosts);
  } catch (error: any) {
    console.error("Error fetching prioritized feed:", error);
    res.status(500).json({ error: 'Unable to fetch feed.' });
  }
});

app.patch('/posts/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post!.author_id !== req.user!.userId) {
      return res.status(403).json({ error: "You can only edit your own posts." });
    }
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { content },
    });
    res.json(updatedPost);
  } catch (error: any) {
    res.status(500).json({ error: "Unable to update post." });
  }
});

app.delete('/posts/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post!.author_id !== req.user!.userId) {
      return res.status(403).json({ error: "You can only delete your own posts." });
    }
    await prisma.post.update({
      where: { id: postId },
      data: { deleted_at: new Date() },
    });
    res.json({ message: 'Post deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: "Unable to delete post." });
  }
});

app.get('/posts/:postId/comments', async (req: express.Request, res: express.Response) => {
  try {
    const { postId } = req.params;
    const comments = await prisma.comment.findMany({
      where: {
        post_id: parseInt(postId),
        parent_id: null,
        deleted_at: null,
      },
      include: {
        author: true,
        replies: {
          where: { deleted_at: null },
          include: {
            author: true,
            replies: {
              where: { deleted_at: null },
              include: { author: true }
            }
          }
        }
      },
      orderBy: { created_at: 'asc' },
    });
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch comments' });
  }
});

app.post('/posts/:postId/comments', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { postId } = req.params;
    const { content, parent_id } = req.body;
    const author_id = req.user!.userId;
    const newComment = await prisma.comment.create({
      data: {
        content,
        author_id,
        post_id: parseInt(postId),
        parent_id: parent_id,
      },
      include: { author: true },
    });
    const post = await prisma.post.findUnique({ where: { id: parseInt(postId) } });
    if (post) {
      await updateFriendship(author_id, post.author_id, { num_comments: { increment: 1 } });
    }
    res.json(newComment);
  } catch (error: any) {
    console.error("Failed to create comment. Error:", error);
    res.status(500).json({ error: 'Unable to create comment. See server logs for details.' });
  }
});

app.patch('/comments/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const commentId = parseInt(req.params.id);
    const { content } = req.body;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (comment!.author_id !== req.user!.userId) {
      return res.status(403).json({ error: "You can only edit your own comments." });
    }
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });
    res.json(updatedComment);
  } catch (error: any) {
    res.status(500).json({ error: "Unable to update comment." });
  }
});

app.delete('/comments/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const commentId = parseInt(req.params.id);
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (comment!.author_id !== req.user!.userId) {
      return res.status(403).json({ error: "You can only delete your own comments." });
    }
    await prisma.comment.update({
      where: { id: commentId },
      data: { deleted_at: new Date() },
    });
    res.json({ message: 'Comment deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: "Unable to delete comment." });
  }
});

app.get('/posts/:postId/reactions', async (req: express.Request, res: express.Response) => {
  try {
    const { postId } = req.params;
    const reactions = await prisma.reaction.findMany({
      where: { post_id: parseInt(postId) },
    });
    res.json(reactions);
  } catch (error: any) {
    res.json({ error: 'Unable to fetch reactions' });
  }
});

app.post('/posts/:postId/reactions', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid Post ID." });
    }
    const userId = req.user!.userId;
    const { reaction_type } = req.body;
    if (!reaction_type || typeof reaction_type !== 'string') {
      return res.status(400).json({ error: "Invalid reaction type provided." });
    }
    const existingReaction = await prisma.reaction.findUnique({
      where: { user_id_post_id: { user_id: userId, post_id: postId } },
    });
    if (existingReaction) {
      if (existingReaction.reaction_type === reaction_type) {
        await prisma.reaction.delete({ where: { id: existingReaction.id } });
        return res.json({ message: 'Reaction removed' });
      } else {
        const updatedReaction = await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { reaction_type },
        });
        return res.json(updatedReaction);
      }
    } else {
      const newReaction = await prisma.reaction.create({
        data: { user_id: userId, post_id: postId, reaction_type },
      });
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (post && post.author_id !== userId) {
        await updateFriendship(userId, post.author_id, { num_reactions: { increment: 1 } });
      }
      return res.json(newReaction);
    }
  } catch (error: any) {
    console.error("Error processing reaction:", error);
    res.status(500).json({ error: 'Unable to process reaction' });
  }
});

app.post('/users/:id/follow', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const follower_id = req.user!.userId;
    const following_id = parseInt(req.params.id);
    const existingFollow = await prisma.follows.findUnique({
      where: { follower_id_following_id: { follower_id, following_id } },
    });
    if (existingFollow) {
      await prisma.follows.delete({
        where: { follower_id_following_id: { follower_id, following_id } },
      });
      res.json({ message: 'Unfollowed user or canceled request.' });
    } else {
      await prisma.follows.create({
        data: { follower_id, following_id, status: 'pending' },
      });
      res.json({ message: 'Follow request sent.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to process follow request.' });
  }
});

app.get('/follows/pending', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const currentUserId = req.user!.userId;
    const requests = await prisma.follows.findMany({
      where: {
        following_id: currentUserId,
        status: 'pending',
      },
      include: { follower: true },
    });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch pending requests.' });
  }
});

app.patch('/follows/respond', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const currentUserId = req.user!.userId;
    const { follower_id, newStatus } = req.body;
    if (newStatus !== 'accepted' && newStatus !== 'declined') {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    if (newStatus === 'accepted') {
      await prisma.follows.update({
        where: {
          follower_id_following_id: { follower_id, following_id: currentUserId },
        },
        data: { status: 'accepted' },
      });
      res.json({ message: 'Follow request accepted.' });
    } else {
      await prisma.follows.delete({
        where: {
          follower_id_following_id: { follower_id, following_id: currentUserId },
        },
      });
      res.json({ message: 'Follow request declined.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to respond to request.' });
  }
});

app.get('/users/:id/followers', async (req: express.Request, res: express.Response) => {
  try {
    const user_id = parseInt(req.params.id);
    const followers = await prisma.follows.findMany({
      where: { following_id: user_id, status: 'accepted' },
      include: { follower: true },
    });
    res.json(followers);
  } catch (error: any) {
    res.json({ error: 'Unable to fetch followers' });
  }
});

app.get('/users/:id/following', async (req: express.Request, res: express.Response) => {
  try {
    const user_id = parseInt(req.params.id);
    const following = await prisma.follows.findMany({
      where: { follower_id: user_id },
      include: { following: true },
    });
    res.json(following);
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching following list.' });
  }
});

app.get('/conversations', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const currentUserId = req.user!.userId;
    const followingResult = await prisma.follows.findMany({
      where: { follower_id: currentUserId },
      select: { following_id: true }
    });
    const followingIds = followingResult.map((f: any) => f.following_id);

    const mutualsResult = await prisma.follows.findMany({
      where: {
        following_id: currentUserId,
        follower_id: { in: followingIds }
      },
      select: { follower_id: true }
    });
    const mutualIds = mutualsResult.map((m: any) => m.follower_id);

    const conversations = await prisma.conversation.findMany({
      where: {
        AND: [
          { participants: { some: { id: currentUserId } } },
          { participants: { some: { id: { in: mutualIds } } } }
        ]
      },
      include: {
        participants: true,
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: { sender: true }
        }
      }
    });
    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch conversations' });
  }
});

app.get('/conversations/:id/messages', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const conversationId = parseInt(req.params.id);
    const messages = await prisma.message.findMany({
      where: { conversation_id: conversationId },
      include: { sender: true },
      orderBy: { created_at: 'asc' }
    });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch messages' });
  }
});

app.post('/conversations', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { participant_ids, name } = req.body;
    const initiator_id = req.user!.userId;
    if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
      return res.status(400).json({ error: "Participant IDs are required." });
    }
    const allParticipantIds = [...new Set([initiator_id, ...participant_ids])];
    allParticipantIds.sort();

    let conversationToReturn = null;
    if (allParticipantIds.length === 2) {
      const existingOneOnOne = await prisma.conversation.findFirst({
        where: {
          participants: { every: { id: { in: allParticipantIds } } },
        },
        include: { participants: true }
      });
      if (existingOneOnOne) {
        conversationToReturn = existingOneOnOne;
      }
    }
    if (!conversationToReturn) {
      const participantConnections = allParticipantIds.map(id => ({ id: id }));
      const newConversation = await prisma.conversation.create({
        data: {
          name: allParticipantIds.length > 2 ? name : null,
          participants: {
            connect: participantConnections,
          },
        },
        include: { participants: true }
      });
      conversationToReturn = newConversation;
    }
    res.json(conversationToReturn);
  } catch (error: any) {
    console.error("Error starting conversation:", error);
    res.status(500).json({ error: 'Unable to start conversation' });
  }
});

io.on('connection', (socket: any) => {
  console.log('a user connected:', socket.id);

  socket.on('join_conversation', (conversationId: any) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('send_message', async (data: any) => {
    try {
      const { content, sender_id, conversation_id } = data;
      const convoIdInt = parseInt(conversation_id);
      if (isNaN(convoIdInt)) {
        throw new Error("Invalid conversation_id format.");
      }
      const conversation = await prisma.conversation.findUnique({
        where: { id: convoIdInt },
        include: { participants: true },
      });
      const recipient = conversation!.participants.find((p: any) => p.id !== sender_id);
      if (recipient) {
        await updateFriendship(sender_id, recipient.id, { num_messages: { increment: 1 } });
      }
      const newMessage = await prisma.message.create({
        data: { content, sender_id, conversation_id: convoIdInt },
        include: { sender: true },
      });
      io.to(conversation_id).emit('receive_message', newMessage);
    } catch (error: any) {
      console.error("Error in send_message:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});

export { };