// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Request } from 'express';
// import { Strategy } from 'passport-jwt';
// import { UserRole } from 'src/user/schemas/user.schema';

// export interface userPayloadType {
//   sub: string;
//   username: string;
//   role: UserRole;
// }

// interface userReturnType {
//   userId: string;
//   username: string;
//   role: UserRole;
// }

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor() {
//     const jwtSecret = process.env.JWT_SECRET;
//     if (!jwtSecret) {
//       throw new Error('JWT_SECRET must be defined');
//     }
//     super({
//       // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       jwtFromRequest: cookieExtractor,
//       ignoreExpiration: false,
//       secretOrKey: jwtSecret,
//     });
//   }

//   async validate(payload: userPayloadType): Promise<userReturnType> {
//     return {
//       userId: payload.sub,
//       username: payload.username,
//       role: payload.role,
//     };
//   }
// }

// const cookieExtractor = (req: Request) => {
//   return req?.cookies?.access_token;
// };


import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from 'src/user/schemas/user.schema';

export interface userPayloadType {
  sub: string;
  username: string;
  role: UserRole;
  email?: string;
}

interface userReturnType {
  userId: string;
  username: string;
  role: UserRole;
  email?: string;
}

const cookieExtractor = (req: Request): string | null => {
  return req?.cookies?.access_token || null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET must be defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,                          // web — cookie se
        ExtractJwt.fromAuthHeaderAsBearerToken(),  // app — Authorization header se
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: userPayloadType): Promise<userReturnType> {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      email: payload.email,
    };
  }
}