import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import * as cookie from 'cookie';

// ws-auth.middleware.ts

export const wsAuthMiddleware = (jwtService: JwtService, jwtSecret: string) => {
  return (socket: Socket, next: (err?: Error) => void) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error('No token provided'));
      }

      const payload = jwtService.verify(token, { secret: jwtSecret });
      socket.data.user = payload;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  };
};

const extractToken = (socket: Socket): string | null => {
  // 1. RN app — handshake.auth.token (jo humne pehle socket client mein set kiya tha)
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  // 2. Web — cookie se
  const cookies = socket.handshake.headers.cookie;
  if (cookies) {
    const parsed = parseCookie(cookies);
    if (parsed?.access_token) return parsed.access_token;
  }

  return null;
};

const parseCookie = (cookieHeader: string): Record<string, string> => {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, value] = part.trim().split('=');
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);
};