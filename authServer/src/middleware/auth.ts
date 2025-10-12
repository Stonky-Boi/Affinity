import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: number;
    email: string;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: "Authorization token required." });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return res.status(500).json({ error: "Server configuration error." });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            // e.g., TokenExpiredError, JsonWebTokenError
            return res.status(403).json({ error: "Token is not valid." });
        }
        req.user = user as JwtPayload;
        next(); // Proceed to the next middleware or route handler
    });
};
