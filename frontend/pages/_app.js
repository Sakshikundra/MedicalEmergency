import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../styles/globals.css';
import { useState } from 'react';

export default function App({ Component, pageProps }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: 1,
                staleTime: 5 * 60 * 1000, // 5 minutes
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <Component {...pageProps} />
        </QueryClientProvider>
    );
}
