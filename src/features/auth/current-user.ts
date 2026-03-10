import 'server-only';

import { cache } from 'react';

import { getProfileBySession } from './profile';
import { getCurrentSession } from './session';
import type { AppSession, CurrentProfile } from './types';

export interface CurrentUserContext {
  session: AppSession | null;
  profile: CurrentProfile | null;
  isAuthenticated: boolean;
}

export const getCurrentUserContext = cache(async (): Promise<CurrentUserContext> => {
  const session = await getCurrentSession();
  const profile = await getProfileBySession(session);

  return {
    session,
    profile,
    isAuthenticated: Boolean(session && profile),
  };
});

export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const context = await getCurrentUserContext();
  return context.profile;
});
