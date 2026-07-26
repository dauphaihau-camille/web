import type { DocumentAccessGrantPermission } from '@/domains/document';

export const permissionOptions: Array<{
  description?: string;
  label: string;
  value: DocumentAccessGrantPermission;
}> = [
  {
    description: 'Edit, suggest, comment, and share',
    label: 'Full access',
    value: 'manage',
  },
  {
    description: 'Edit, suggest, and comment',
    label: 'Can edit',
    value: 'edit',
  },
  {
    description: 'Suggest and comment',
    label: 'Can comment',
    value: 'comment',
  },
  { label: 'Can view', value: 'view' },
];

export function getPermissionLabel(permission: DocumentAccessGrantPermission): string {
  switch (permission) {
    case 'manage':
      return 'Full access';
    case 'edit':
      return 'Can edit';
    case 'comment':
      return 'Can comment';
    case 'view':
      return 'Can view';
  }
}
