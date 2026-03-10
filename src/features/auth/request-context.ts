import 'server-only';

import type { NextRequest } from 'next/server';

import { getProfileBySession } from './profile';
import { getCurrentSessionFromRequest } from './session';
import type { AppSession, CurrentProfile } from './types';

export interface RequestUserContext {
  session: AppSession | null;
  profile: CurrentProfile | null;
  isAuthenticated: boolean;
}

export async function getRequestUserContext(
  request: NextRequest,
): Promise<RequestUserContext> {
  const session = getCurrentSessionFromRequest(request);
  const profile = await getProfileBySession(session);

  return {
    session,
    profile,
    isAuthenticated: Boolean(session && profile),
  };
}
