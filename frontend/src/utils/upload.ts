export const uploadToCloudinary = async (file: File, token: string): Promise<string> => {
    // 1. Get signature from our backend
    const signatureResponse = await fetch('/api/upload/signature', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!signatureResponse.ok) {
        throw new Error("Failed to get upload signature from server.");
    }
    const { signature, timestamp } = await signatureResponse.json();

    // 2. Prepare form data for Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', (import.meta as any).env.VITE_CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('resource_type', 'auto');
    formData.append('folder', 'affinity_uploads');

    // 3. Upload directly to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${(import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`;
    
    const uploadResponse = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
    });

    if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to Cloudinary.");
    }

    const uploadData = await uploadResponse.json();
    return uploadData.secure_url;
};