import type { AuthVerifier, VerifiedIdentity } from '../middlewares/authentication.middleware.js';

export class StaticAuthVerifier implements AuthVerifier {
  constructor(
    private readonly identities: Record<string, VerifiedIdentity> = {},
  ) {}

  async verifyIdToken(idToken: string) {
    const identity = this.identities[idToken];

    if (!identity) {
      throw new Error('invalid token');
    }

    return identity;
  }

  async isReady() {
    return true;
  }
}

