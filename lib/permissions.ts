export type Role = 'admin' | 'teacher' | 'student';

export type Permission =
  | 'course:create'
  | 'course:add-chapter'
  | 'course:add-lesson'
  | 'course:edit'
  | 'course:delete'
  | 'course:view-content';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'course:create',
    'course:add-chapter',
    'course:add-lesson',
    'course:edit',
    'course:delete',
    'course:view-content',
  ],
  teacher: [
    'course:add-chapter',
    'course:add-lesson',
    'course:edit',
    'course:delete',
    'course:view-content',
  ],
  student: [],
};

export function getRolePermissions(role: Role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role | null | undefined, permission: Permission) {
  if (!role) return false;
  return getRolePermissions(role).includes(permission);
}
