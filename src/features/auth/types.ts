export type AppSessionRole = 'user' | 'admin';

export interface AppSession {
  profileId: string;
  telegramUserId: number;
  role: AppSessionRole;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  expiresAt: number;
}

export interface TelegramIdentity {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  photo_url?: string;
}

export interface CurrentProfile {
  id: string;
  role: AppSessionRole;
  telegramUserId: number | null;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}
