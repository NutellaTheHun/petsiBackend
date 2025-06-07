import { userExample } from '../users/user.example';

export function roleExample(fnSet: Set<string>) {
  fnSet.add(roleExample.name);
  return {
    id: 1,
    roleName: 'staff',
    users: fnSet.has(roleExample.name) ? undefined : [userExample(fnSet)],
  };
}
