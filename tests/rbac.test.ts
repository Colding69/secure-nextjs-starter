import { describe, expect, it } from "vitest";
import {
  can,
  isRole,
  permissions,
  roles,
  type Permission,
  type Role,
} from "@/lib/rbac";

const allPermissions = permissions.admin as readonly Permission[];

const expected: Record<Role, Permission[]> = {
  viewer: ["dashboard:read"],
  editor: ["dashboard:read", "preview:fetch", "upload:create"],
  admin: [...allPermissions],
};

describe("RBAC policy", () => {
  it("recognizes only known roles", () => {
    for (const role of roles) expect(isRole(role)).toBe(true);
    expect(isRole("owner")).toBe(false);
    expect(isRole(undefined)).toBe(false);
    expect(isRole(42)).toBe(false);
  });

  it("matches the full role × permission matrix", () => {
    for (const role of roles) {
      for (const permission of allPermissions) {
        expect(can(role, permission), `${role} -> ${permission}`).toBe(
          expected[role].includes(permission),
        );
      }
    }
  });

  it("denies unknown or missing roles", () => {
    for (const permission of allPermissions) {
      expect(can(undefined, permission)).toBe(false);
      expect(can("superadmin", permission)).toBe(false);
      expect(can("", permission)).toBe(false);
    }
  });
});
