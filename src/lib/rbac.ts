export const roles = ["viewer", "editor", "admin"] as const;

export type Role = (typeof roles)[number];

export const permissions = {
  viewer: ["dashboard:read"],
  editor: ["dashboard:read", "preview:fetch", "upload:create"],
  admin: [
    "dashboard:read",
    "preview:fetch",
    "upload:create",
    "admin:read",
    "users:role",
  ],
} as const satisfies Record<Role, readonly string[]>;

export type Permission = (typeof permissions)[Role][number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (roles as readonly string[]).includes(value);
}

export function can(role: string | undefined, permission: Permission): boolean {
  if (!isRole(role)) return false;
  return (permissions[role] as readonly string[]).includes(permission);
}

export function assertCan(
  role: string | undefined,
  permission: Permission,
): asserts role is Role {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: missing permission "${permission}"`);
  }
}
