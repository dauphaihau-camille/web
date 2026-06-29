import { queryOptions } from '@tanstack/react-query';

import { authKeys } from './auth.keys';
import { getCurrentUser } from './auth.requests';

export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: authKeys.currentUser(),
    queryFn: getCurrentUser,
  });
}
