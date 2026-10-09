import type { AccessTokenPayload } from '../modules/auth/token';

declare global {
  namespace Express {
    interface Request {
      /** Preenchido pelo middleware `requestContext`. */
      requestId: string;
      /** Preenchido pelo middleware `authenticate`. */
      admin?: AccessTokenPayload;
    }
  }
}

export {};
