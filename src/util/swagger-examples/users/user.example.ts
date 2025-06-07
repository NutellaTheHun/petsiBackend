import { roleExample } from '../roles/role.example';

export function userExample(fnSet: Set<string>) {
  fnSet.add(userExample.name);
  return {
    id: 1,
    userName: 'jim',
    email: 'jim@email.com',
    roles: fnSet.has(roleExample.name) ? undefined : [roleExample(fnSet)],
  };
}
