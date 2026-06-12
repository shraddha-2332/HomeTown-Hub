export function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
