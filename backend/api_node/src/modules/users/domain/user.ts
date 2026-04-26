import { userProfileSchema, type UserProfile, type UserStatus } from '@eixoone/shared-contracts';

export type UserEntity = UserProfile;
export type UserEntityStatus = UserStatus;

export function parseUserEntity(input: unknown): UserEntity {
  return userProfileSchema.parse(input);
}

