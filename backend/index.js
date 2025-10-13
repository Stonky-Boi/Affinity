const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./middleware/auth');

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
require('dotenv').config();
// --- Auth Routes ---
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
    console.log(error);
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
  try {
    const posts = await prisma.post.findMany({
      include: { author: true }, // This tells Prisma to also fetch the related author
    });
    res.json(posts);
  } catch (error) {
    res.json({ error: 'Unable to fetch posts' });
  }
});

// --- Comment Routes ---
app.get('/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { post_id: parseInt(postId) },
      include: { author: true },
    });
    res.json(comments);
  } catch (error) {
    res.json({ error: 'Unable to fetch comments' });
  }
});

app.post('/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params;
  const { content, author_id } = req.body;
  try {
    const newComment = await prisma.comment.create({
      data: {
        content,
        author_id,
        post_id: parseInt(postId),
      },
    });
    res.json(newComment);
  } catch (error) {
    res.json({ error: 'Unable to create comment' });
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

app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
