import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UseApiOptions extends RequestInit {
    skip?: boolean;
}

export function useApi<T>(url: string | null, options: UseApiOptions = {}) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();
    const { skip, ...fetchOptions } = options;
    const fetchData = useCallback(async () => {
        if (skip || !url) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        if (!token) {
            setIsLoading(false);
            setError("No authentication token found.");
            return;
        }
        try {
            const headers = new Headers(fetchOptions.headers || {});
            headers.set('Authorization', `Bearer ${token}`);
            if (!headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
            }
            const response = await fetch(url, { ...fetchOptions, headers });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    logout(user?.id);
                    navigate('/login');
                    throw new Error("Your session has expired. Please log in again.");
                }
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
            }
            const responseData = await response.json();
            setData(responseData);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [url, token, user, logout, navigate, JSON.stringify(fetchOptions), skip]);
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    return { data, isLoading, error, setError, refresh: fetchData };
}