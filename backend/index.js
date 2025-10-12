const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./middleware/auth');

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  }
});
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
    res.json(newComment);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create comment' });
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
      res.json(newReaction);
    }
  } catch (error) {
    res.json({ error: 'Unable to process reaction' });
  }
});

// --- Follow Routes ---
app.post('/users/:id/follow', async (req, res) => {
  const { follower_id } = req.body; // This is the ID of the user who is clicking "follow"
  const following_id = parseInt(req.params.id); // This is the ID of the user to be followed

  try {
    const existingFollow = await prisma.follows.findUnique({
      where: {
        follower_id_following_id: { follower_id, following_id },
      },
    });

    if (existingFollow) {
      // If the relationship exists, delete it (unfollow)
      await prisma.follows.delete({ where: { follower_id_following_id: { follower_id, following_id } } });
      res.json({ message: 'Unfollowed user' });
    } else {
      // If it doesn't exist, create it (follow)
      await prisma.follows.create({
        data: { follower_id, following_id },
      });
      res.json({ message: 'Followed user' });
    }
  } catch (error) {
    res.json({ error: 'Unable to process follow request' });
  }
});

app.get('/users/:id/followers', async (req, res) => {
  const user_id = parseInt(req.params.id);
  try {
    const followers = await prisma.follows.findMany({
      where: { following_id: user_id },
      include: { follower: true }, // Include the full user object of the follower
    });
    res.json(followers);
  } catch (error) {
    res.json({ error: 'Unable to fetch followers' });
  }
});

app.get('/users/:id/following', async (req, res) => {
  const user_id = parseInt(req.params.id);
  try {
    const following = await prisma.follows.findMany({
      where: { follower_id: user_id },
      include: { following: true }, // Include the full user object of the person being followed
    });
    res.json(following);
  } catch (error) {
    res.json({ error: 'Unable to fetch following list' });
  }
});

// --- Messaging Routes ---
app.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { id: req.user.userId } }
      },
      include: {
        participants: true, // Include details of who is in the conversation
        messages: { // Include the last message for a preview
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