import { useAuth } from "./useAuth";
import { MemberRole } from "@/types/supabase";

export function usePermissions() {
  const { member } = useAuth();

  const hasRole = (role: MemberRole) => member?.role === role;

  const hasAnyRole = (roles: MemberRole[]) => roles.includes(member?.role ?? "user");

  const hasAllRoles = (roles: MemberRole[]) => roles.every((role) => hasRole(role));

  const isAdmin = () => {
    const adminRoles: MemberRole[] = ["application_admin", "union_admin", "division_admin", "company_admin"];
    return hasAnyRole(adminRoles);
  };

  const isUnionAdmin = () => hasRole("union_admin");

  const isDivisionAdmin = () => hasRole("division_admin");

  const isCompanyAdmin = () => hasRole("company_admin");

  const isApplicationAdmin = () => hasRole("application_admin");

  const canManageUsers = () => {
    const adminRoles: MemberRole[] = ["application_admin", "union_admin", "division_admin"];
    return hasAnyRole(adminRoles);
  };

  const canManageDivisions = () => {
    const adminRoles: MemberRole[] = ["application_admin", "union_admin"];
    return hasAnyRole(adminRoles);
  };

  const canManageOfficers = () => {
    const adminRoles: MemberRole[] = ["application_admin", "union_admin", "division_admin"];
    return hasAnyRole(adminRoles);
  };

  const canManageCalendar = () => {
    const adminRoles: MemberRole[] = ["application_admin", "union_admin", "division_admin", "company_admin"];
    return hasAnyRole(adminRoles);
  };

  const canViewAnalytics = () => {
    const adminRoles: MemberRole[] = ["application_admin", "union_admin", "division_admin"];
    return hasAnyRole(adminRoles);
  };

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isUnionAdmin,
    isDivisionAdmin,
    isCompanyAdmin,
    isApplicationAdmin,
    canManageUsers,
    canManageDivisions,
    canManageOfficers,
    canManageCalendar,
    canViewAnalytics,
  };
}
