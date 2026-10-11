export const ADMIN_EMAIL = 'sarthaksrivastava1084@gmail.com';

/**
 * Returns true strictly and only if the provided email matches sarthaksrivastava1084@gmail.com
 */
export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
