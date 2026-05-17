import React from 'react';
import { ApolloProvider } from '@apollo/client/react';
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
} from '@apollo/client/core';
import { SchedulingDashboard } from './pages/SchedulingDashboard';

type ScheduleModuleProps = {
  projectId: string;
  currentUserId: string | undefined;
};

const graphqlUri =
  import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: graphqlUri }),
  cache: new InMemoryCache(),
});

export function ScheduleModule({ projectId, currentUserId }: ScheduleModuleProps) {
  return (
    <ApolloProvider client={apolloClient}>
      <SchedulingDashboard projectId={projectId} currentUserId={currentUserId} />
    </ApolloProvider>
  );
}
