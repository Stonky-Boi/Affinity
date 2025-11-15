import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import postRouter from './post.routes';
import commentRouter from './comment.routes';
import followRouter from './follow.routes';
import conversationRouter from './conversation.routes';
import blockRouter from './block.routes';
import uploadRouter from './upload.routes';
import messageRouter from './message.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/posts', postRouter);
router.use('/comments', commentRouter);
router.use('/follows', followRouter);
router.use('/conversations', conversationRouter);
router.use('/block', blockRouter);
router.use('/upload', uploadRouter);
router.use('/messages', messageRouter);

export default router;