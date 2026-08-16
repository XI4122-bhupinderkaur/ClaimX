import EncryptedStorage from 'react-native-encrypted-storage';

import type { User } from '../types/user';

export interface AuthSessionRecord {
  user: User;
  token: string;
  refreshToken?: string;
}

const SESSION_KEY = 'claimx-auth-session';

export const saveSession = async (session: AuthSessionRecord): Promise<void> => {
  try {
    await EncryptedStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user: session.user,
        token: session.token,
        ...(session.refreshToken ? { refreshToken: session.refreshToken } : {}),
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Unable to save session: ${error.message}`);
    }

    throw new Error('Unable to save session');
  }
};

export const getSession = async (): Promise<AuthSessionRecord | null> => {
  try {
    const raw = await EncryptedStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthSessionRecord>;

    if (!parsed.user || !parsed.token) {
      return null;
    }

    return {
      user: parsed.user,
      token: parsed.token,
      refreshToken: parsed.refreshToken,
    };
  } catch {
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  try {
    await EncryptedStorage.removeItem(SESSION_KEY);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Unable to clear session: ${error.message}`);
    }

    throw new Error('Unable to clear session');
  }
};
