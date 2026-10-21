// src/common/utils/auth-response.util.ts
import { Request, Response, CookieOptions } from 'express';

export type ClientType = 'web' | 'mobile';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const isProd = process.env.NODE_ENV === 'production';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'none', // frontend/backend alag domain pe ho to 'none' + secure chahiye
};

export function getClientType(req: Request): ClientType {
  const header = req.headers['x-client-type'];
  if (header === 'mobile' || header === 'web') return header;

  // fallback: native app ke HTTP clients
  const ua = req.headers['user-agent'] ?? '';
  if (/okhttp|CFNetwork|Expo|ReactNative|Dart/i.test(ua)) return 'mobile';

  return 'web';
}

export function sendAuthTokens<T extends object>(
  req: Request,
  res: Response,
  tokens: AuthTokens,
  extra?: T,
) {
  if (getClientType(req) === 'web') {
    res.cookie('access_token', tokens.accessToken, {
      ...baseCookieOptions,
      maxAge: 30 * 60 * 1000, // 15 min
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      ...baseCookieOptions,
      // path: '/auth/refresh', // sirf refresh endpoint pe bheja jayega
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // web: tokens body me nahi bhejte
    return { success: true, ...extra };
  }

  // mobile: tokens body me return
  return { success: true, ...tokens, ...extra };
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', baseCookieOptions);
  res.clearCookie('refresh_token', baseCookieOptions);
}
