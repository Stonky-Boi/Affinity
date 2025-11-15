import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { v2 as cloudinary } from 'cloudinary';

export const getUploadSignature = (req: AuthRequest, res: Response) => {
    const timestamp = Math.round((new Date).getTime()/1000);
    try {
        const params_to_sign = {
            timestamp: timestamp,
            folder: 'affinity_uploads'
        };
        const signature = cloudinary.utils.api_sign_request(
            params_to_sign,
            process.env.CLOUDINARY_API_SECRET as string
        );
        res.json({ timestamp, signature });
    } catch (error: any) {
        console.error("Error signing upload request:", error);
        res.status(500).json({ error: "Failed to get upload signature." });
    }
};