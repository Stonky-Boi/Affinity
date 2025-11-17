type ProgressCallback = (progress: number) => void;

interface UploadOptions {
    onProgress: ProgressCallback;
    abortSignal: AbortSignal;
}

export const uploadToCloudinary = async (
    file: File,
    token: string,
    options: UploadOptions
): Promise<string> => {
    const signatureResponse = await fetch('/api/upload/signature', {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: options.abortSignal, // Allows canceling this pre-flight request
    });
    if (!signatureResponse.ok) {
        throw new Error("Failed to get upload signature from server.");
    }
    const { signature, timestamp } = await signatureResponse.json();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', (import.meta as any).env.VITE_CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('resource_type', 'auto');
    formData.append('folder', 'affinity_uploads');
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${(import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`;
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', cloudinaryUrl);
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progressPercent = Math.round((event.loaded / event.total) * 100);
                options.onProgress(progressPercent);
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const uploadData = JSON.parse(xhr.responseText);
                resolve(uploadData.secure_url);
            } else {
                const errorData = JSON.parse(xhr.responseText);
                reject(new Error(errorData.error?.message || "Failed to upload file to Cloudinary."));
            }
        };
        xhr.onerror = () => {
            reject(new Error("Upload failed due to a network error."));
        };
        options.abortSignal.onabort = () => {
            xhr.abort();
            reject(new Error("Upload canceled."));
        };
        xhr.send(formData);
    });
};