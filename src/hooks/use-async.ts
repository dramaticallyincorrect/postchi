import { useState, useCallback } from 'react';

// Define the shape of our state
interface AsyncState<T, E = Error> {
    data: T | null;
    loading: boolean;
    error: E | null;
}

export function useAsync<T, E = Error>(asyncFunction: (...args: any[]) => Promise<T>) {
    const [state, setState] = useState<AsyncState<T, E>>({
        data: null,
        loading: false,
        error: null,
    });

    const execute = useCallback(async (...args: any[]) => {
        setState({ data: null, loading: true, error: null });

        try {
            const response = await asyncFunction(...args);
            setState({ data: response, loading: false, error: null });
            return response;
        } catch (err) {
            setState({ data: null, loading: false, error: err as E });
            throw err;
        }
    }, [asyncFunction]);

    return { ...state, execute };
}