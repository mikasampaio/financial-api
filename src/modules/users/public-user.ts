import type { User } from "src/generated/prisma/client";

export const publicUserOmit = {
  password: true,
  authVersion: true,
  resetTokenHash: true,
  resetTokenExpiresAt: true,
  resetRequestedAt: true,
} as const;
export type PublicUser = Omit<User, keyof typeof publicUserOmit>;
export function publicUser(user: User): PublicUser {
  const {
    password,
    authVersion,
    resetTokenHash,
    resetTokenExpiresAt,
    resetRequestedAt,
    ...safe
  } = user;
  return safe;
}
