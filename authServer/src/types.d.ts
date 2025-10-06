// Add the 'user' property to the Express Request interface
declare namespace Express {
  export interface Request {
    user?: {
      userId: number;
      email: string;
    };
  }
}
