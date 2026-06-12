export function hasRole(user, roles) {
  return roles.includes(user.role);
}
