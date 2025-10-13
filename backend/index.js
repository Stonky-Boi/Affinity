const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./middleware/auth');
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
const port = 3000;
app.use(cors());
app.use(express.json());

// --- User Routes ---
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch users' });
  }
});

app.get('/users/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { // Only select public-facing data
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
          include: { author: true } // Include author for the reused PostList
        },
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch user profile.' });
  }
});

app.patch('/users/profile', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
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
    // Return only non-sensitive data
    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Alternate email is already in use." });
    }
    res.status(500).json({ error: "Unable to update profile." });
  }
});

app.get('/users/mutuals', authenticateToken, async (req, res) => {
  const currentUserId = req.user.userId;
  try {
    // 1. Get IDs of people the current user is following
    const followingResult = await prisma.follows.findMany({
      where: { follower_id: currentUserId },
      select: { following_id: true }
    });
    const followingIds = followingResult.map(f => f.following_id);

    // 2. Find followers of the current user WHO ARE IN the followingIds list
    const mutualsResult = await prisma.follows.findMany({
      where: {
        following_id: currentUserId,      // They follow me...
        follower_id: { in: followingIds } // ...and I follow them.
      },
      include: { follower: true } // Include the full user object of the mutual
    });

    // 3. Return just the user objects
    const mutualUsers = mutualsResult.map(m => m.follower);
    res.json(mutualUsers);
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch mutuals." });
  }
});

app.post('/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
    res.json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'User with this email or username already exists.' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    // If login is successful, create a JWT
    const token = jwt.sign(
      { userId: user.id },      // The data to store in the token (the "payload")
      process.env.JWT_SECRET,   // The secret key to sign the token with
      { expiresIn: '24h' }      // Optional: token expiration time
    );

    res.json({ message: 'Login successful!', token, user });

  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// --- Post Routes ---
app.post('/posts', authenticateToken, async (req, res) => {
  // We get the author's ID from the token, not the request body
  const author_id = req.user.userId;
  const { content } = req.body; // The body only needs the content now

  try {
    const newPost = await prisma.post.create({
      data: {
        content,
        author_id,
      },
    });
    res.json(newPost);
  } catch (error) {
    res.json({ error: `Unable to create post` });
  }
});

app.get('/posts', async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { deleted_at: null }, // Only fetch non-deleted posts
    include: { author: true },
    orderBy: { created_at: 'desc' },
  });
  res.json(posts);
});

app.patch('/posts/:id', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id);
  const { content } = req.body;
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post.author_id !== req.user.userId) {
      return res.status(403).json({ error: "You can only edit your own posts." });
    }
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { content },
    });
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: "Unable to update post." });
  }
});

app.delete('/posts/:id', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id);
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post.author_id !== req.user.userId) {
      return res.status(403).json({ error: "You can only delete your own posts." });
    }
    await prisma.post.update({
      where: { id: postId },
      data: { deleted_at: new Date() },
    });
    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: "Unable to delete post." });
  }
});

// --- Comment Routes ---
app.get('/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params;
  try {
    const comments = await prisma.comment.findMany({
      where: {
        post_id: parseInt(postId),
        parent_id: null, // Only fetch top-level comments
        deleted_at: null, // Only fetch non-deleted comments
      },
      include: {
        author: true,
        replies: { // Recursively include replies
          where: { deleted_at: null }, // Also filter deleted replies
          include: {
            author: true,
            replies: { // And their replies
              where: { deleted_at: null },
              include: { author: true }
            }
          }
        }
      },
      orderBy: { created_at: 'asc' },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch comments' });
  }
});

app.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  const { postId } = req.params;
  const { content, parent_id } = req.body; // Add parent_id
  const author_id = req.user.userId;

  try {
    const newComment = await prisma.comment.create({
      data: {
        content,
        author_id,
        post_id: parseInt(postId),
        parent_id: parent_id, // Link to the parent comment if it exists
      },
      include: { author: true },
    });
    // Find the post to identify its author.
    const post = await prisma.post.findUnique({ where: { id: parseInt(postId) } });

    // If the post is found, update the friendship score between the commenter and the author.
    if (post) {
      // author_id comes from the authenticated token, post.author_id comes from the lookup.
      await updateFriendship(author_id, post.author_id, { num_comments: { increment: 1 } });
    }
    res.json(newComment);
  } catch (error) {
    console.error("Failed to create comment. Error:", error); // Log the full error to the terminal
    res.status(500).json({ error: 'Unable to create comment. See server logs for details.' });
  }
});

app.patch('/comments/:id', authenticateToken, async (req, res) => {
  const commentId = parseInt(req.params.id);
  const { content } = req.body;
  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (comment.author_id !== req.user.userId) {
      return res.status(403).json({ error: "You can only edit your own comments." });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });
    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ error: "Unable to update comment." });
  }
});

app.delete('/comments/:id', authenticateToken, async (req, res) => {
  const commentId = parseInt(req.params.id);
  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (comment.author_id !== req.user.userId) {
      return res.status(403).json({ error: "You can only delete your own comments." });
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { deleted_at: new Date() },
    });
    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: "Unable to delete comment." });
  }
});

// --- Reaction Routes ---
app.get('/posts/:postId/reactions', async (req, res) => {
  const { postId } = req.params;
  try {
    const reactions = await prisma.reaction.findMany({
      where: { post_id: parseInt(postId) },
    });
    res.json(reactions);
  } catch (error) {
    res.json({ error: 'Unable to fetch reactions' });
  }
});

app.post('/posts/:postId/react', async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.body; // In a real app, you'd get this from an authenticated session

  try {
    // Check if the user has already reacted to this post
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        user_id_post_id: { // This is the unique constraint we defined in the schema
          user_id: user_id,
          post_id: parseInt(postId),
        },
      },
    });

    if (existingReaction) {
      // If reaction exists, delete it (unlike)
      await prisma.reaction.delete({ where: { id: existingReaction.id } });
      res.json({ message: 'Reaction removed' });
    } else {
      // If reaction does not exist, create it (like)
      const newReaction = await prisma.reaction.create({
        data: {
          user_id,
          post_id: parseInt(postId),
        },
      });
      // Find the post to identify its author.
      const post = await prisma.post.findUnique({ where: { id: parseInt(postId) } });

      // If the post is found, update the friendship score between the liker and the author.
      if (post) {
        // user_id comes from req.body, post.author_id comes from the database lookup.
        await updateFriendship(user_id, post.author_id, { num_reactions: { increment: 1 } });
      }
      res.json(newReaction);
    }
  } catch (error) {
    res.json({ error: 'Unable to process reaction' });
  }
});

// --- Follow Routes ---
app.post('/users/:id/follow', authenticateToken, async (req, res) => {
  const follower_id = req.user.userId;
  const following_id = parseInt(req.params.id);

  try {
    const existingFollow = await prisma.follows.findUnique({
      where: { follower_id_following_id: { follower_id, following_id } },
    });

    if (existingFollow) {
      // If a relationship exists (pending or accepted), this action deletes it (unfollow/cancel request)
      await prisma.follows.delete({
        where: { follower_id_following_id: { follower_id, following_id } },
      });
      res.json({ message: 'Unfollowed user or canceled request.' });
    } else {
      // If no relationship exists, create a new pending request
      await prisma.follows.create({
        data: { follower_id, following_id, status: 'pending' },
      });
      res.json({ message: 'Follow request sent.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Unable to process follow request.' });
  }
});

app.get('/follows/pending', authenticateToken, async (req, res) => {
  const currentUserId = req.user.userId;
  try {
    const requests = await prisma.follows.findMany({
      where: {
        following_id: currentUserId,
        status: 'pending',
      },
      include: { follower: true }, // Include info about who sent the request
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch pending requests.' });
  }
});

app.patch('/follows/respond', authenticateToken, async (req, res) => {
  const currentUserId = req.user.userId;
  const { follower_id, newStatus } = req.body; // newStatus should be "accepted" or "declined"

  if (newStatus !== 'accepted' && newStatus !== 'declined') {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  try {
    if (newStatus === 'accepted') {
      // If accepted, update the status
      await prisma.follows.update({
        where: {
          follower_id_following_id: { follower_id, following_id: currentUserId },
        },
        data: { status: 'accepted' },
      });
      res.json({ message: 'Follow request accepted.' });
    } else {
      // If declined, just delete the request
      await prisma.follows.delete({
        where: {
          follower_id_following_id: { follower_id, following_id: currentUserId },
        },
      });
      res.json({ message: 'Follow request declined.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Unable to respond to request.' });
  }
});

app.get('/users/:id/followers', async (req, res) => {
  const user_id = parseInt(req.params.id);
  try {
    const followers = await prisma.follows.findMany({
      where: { following_id: user_id, status: 'accepted' },
      include: { follower: true }, // Include the full user object of the follower
    });
    res.json(followers);
  } catch (error) {
    res.json({ error: 'Unable to fetch followers' });
  }
});

app.get('/users/:id/following', authenticateToken, async (req, res) => {
  const user_id = parseInt(req.params.id);
  try {
    const following = await prisma.follows.findMany({
      // The "status: 'accepted'" filter has been REMOVED from here
      where: { follower_id: user_id },
      include: { following: true },
    });
    res.json(following);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch following list.' });
  }
});

// --- Messaging Routes ---
app.get('/conversations', authenticateToken, async (req, res) => {
  const currentUserId = req.user.userId;
  try {
    // 1. Get the IDs of all mutual followers
    const followingResult = await prisma.follows.findMany({
      where: { follower_id: currentUserId },
      select: { following_id: true }
    });
    const followingIds = followingResult.map(f => f.following_id);

    const mutualsResult = await prisma.follows.findMany({
      where: {
        following_id: currentUserId,
        follower_id: { in: followingIds }
      },
      select: { follower_id: true }
    });
    const mutualIds = mutualsResult.map(m => m.follower_id);

    // 2. Fetch conversations ONLY with mutuals
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
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch conversations' });
  }
});

app.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  const conversationId = parseInt(req.params.id);
  try {
    const messages = await prisma.message.findMany({
      where: { conversation_id: conversationId },
      include: { sender: true },
      orderBy: { created_at: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch messages' });
  }
});

app.post('/conversations', authenticateToken, async (req, res) => {
  const { recipient_id } = req.body;
  const initiator_id = req.user.userId;

  try {
    // Look for an existing conversation with exactly these two participants
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: initiator_id } } },
          { participants: { some: { id: recipient_id } } },
        ],
        // Ensure it's a 1-on-1 chat for now
        participants: { every: { id: { in: [initiator_id, recipient_id] } } }
      },
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    // If not found, create a new one
    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [{ id: initiator_id }, { id: recipient_id }],
        },
      },
    });
    res.json(newConversation);
  } catch (error) {
    res.status(500).json({ error: 'Unable to start conversation' });
  }
});

// --- Socket.io Real-Time Logic ---
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('send_message', async (data) => {
    const { content, sender_id, conversation_id } = data;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversation_id },
      include: { participants: true }, // Get all participants in the chat
    });

    // Find the other person in the chat (not the sender).
    const recipient = conversation.participants.find(p => p.id !== sender_id);

    // If a recipient exists, update the friendship score between the sender and recipient.
    if (recipient) {
      await updateFriendship(sender_id, recipient.id, { num_messages: { increment: 1 } });
    }

    const newMessage = await prisma.message.create({
      data: {
        content,
        sender_id,
        conversation_id,
      },
      include: { sender: true },
    });

    io.to(conversation_id).emit('receive_message', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
