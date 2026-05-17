import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ToastProvider } from "./ui/ToastProvider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
} from '@apollo/client/core';

// 🎯 QW#4: Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minute cache validity
      gcTime: 1000 * 60 * 10, // 10 minute garbage collection
      retry: 1,
    },
  },
  // Query deduplication handled by React Query's default behavior
});

const graphqlUri =
  import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: graphqlUri }),
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ApolloProvider client={apolloClient}>
        <BrowserRouter>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BrowserRouter>
      </ApolloProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
