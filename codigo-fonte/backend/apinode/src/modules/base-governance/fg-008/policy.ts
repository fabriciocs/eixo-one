import {
  FG008_ERROR_MESSAGES,
  FG008_MODULE_KEY,
  FG008_PERMISSION_KEYS,
  type Fg008PermissionKey,
  type TenantScope
} from "../../../../../../packages/sharedcontracts/src";
import { Fg008HttpError, type AuthContext } from "./types";

function hasPermission(actor: AuthContext, permission: Fg008PermissionKey): boolean {
  return actor.permissionKeys.includes(permission) || actor.roleKeys.includes("platform_admin");
}

function hasModule(actor: AuthContext): boolean {
  return actor.moduleKeys.includes(FG008_MODULE_KEY) || actor.roleKeys.includes("platform_admin");
}

export function assertAuthenticated(actor?: AuthContext): asserts actor is AuthContext {
  if (!actor?.uid) {
    throw new Fg008HttpError(401, {
      code: "AUTH_REQUIRED",
      message: FG008_ERROR_MESSAGES.AUTH_REQUIRED
    });
  }
}

export function assertModuleAllowed(actor: AuthContext): void {
  if (!hasModule(actor)) {
    throw new Fg008HttpError(403, {
      code: "MODULE_NOT_ALLOWED",
      message: FG008_ERROR_MESSAGES.MODULE_NOT_ALLOWED
    });
  }
}

export function assertPermission(actor: AuthContext, permission: Fg008PermissionKey): void {
  if (!hasPermission(actor, permission)) {
    throw new Fg008HttpError(403, {
      code: "PERMISSION_DENIED",
      message: FG008_ERROR_MESSAGES.PERMISSION_DENIED
    });
  }
}

export function assertRead(actor: AuthContext): void {
  assertPermission(actor, FG008_PERMISSION_KEYS.read);
}

export function assertCreate(actor: AuthContext): void {
  assertPermission(actor, FG008_PERMISSION_KEYS.create);
}

export function assertUpdate(actor: AuthContext, status?: string): void {
  if (status === "suspended") assertPermission(actor, FG008_PERMISSION_KEYS.suspend);
  else if (status === "active") assertPermission(actor, FG008_PERMISSION_KEYS.reactivate);
  else if (status === "archived") assertPermission(actor, FG008_PERMISSION_KEYS.archive);
  else assertPermission(actor, FG008_PERMISSION_KEYS.update);
}

export function assertExport(actor: AuthContext): void {
  assertPermission(actor, FG008_PERMISSION_KEYS.export);
}

export function assertHistory(actor: AuthContext): void {
  assertPermission(actor, FG008_PERMISSION_KEYS.history);
}

export function assertTenantScope(actor: AuthContext, scope: TenantScope): void {
  if (!scope.tenantId) {
    throw new Fg008HttpError(400, {
      code: "TENANT_SCOPE_REQUIRED",
      message: FG008_ERROR_MESSAGES.TENANT_SCOPE_REQUIRED
    });
  }

  const isPlatformAdmin = actor.roleKeys.includes("platform_admin");
  if (!isPlatformAdmin && actor.tenantId !== scope.tenantId) {
    throw new Fg008HttpError(403, {
      code: "TENANT_SCOPE_DENIED",
      message: "Tenant fora do escopo autorizado."
    });
  }

  if (!isPlatformAdmin && scope.empresaId && actor.empresaIds?.length && !actor.empresaIds.includes(scope.empresaId)) {
    throw new Fg008HttpError(403, {
      code: "EMPRESA_FORBIDDEN",
      message: FG008_ERROR_MESSAGES.EMPRESA_FORBIDDEN
    });
  }

  if (!isPlatformAdmin && scope.filialId && actor.filialIds?.length && !actor.filialIds.includes(scope.filialId)) {
    throw new Fg008HttpError(403, {
      code: "FILIAL_FORBIDDEN",
      message: FG008_ERROR_MESSAGES.FILIAL_FORBIDDEN
    });
  }
}

export function assertMfaForCriticalAction(actor: AuthContext): void {
  if (actor.roleKeys.includes("platform_admin") && actor.mfaVerified !== true) {
    throw new Fg008HttpError(403, {
      code: "MFA_REQUIRED",
      message: "Ação crítica exige MFA ou reautenticação recente."
    });
  }
}
