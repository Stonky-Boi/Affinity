import express = require('express');
const jwt = require('jsonwebtoken');

interface TokenPayload {
  userId: number;
}

export interface AuthRequest extends express.Request {
  user?: TokenPayload; // 'user' is optional and has the type TokenPayload
}

function authenticateToken(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.header('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decodedPayload: any) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = decodedPayload as TokenPayload;
    next();
  });
}

module.exports = { authenticateToken };