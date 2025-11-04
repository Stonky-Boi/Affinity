import { Request, Response } from 'express';
import prisma from '../db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const signup = async (req: Request, res: Response) => {
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
};

export const login = async (req: Request, res: Response) => {
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
};