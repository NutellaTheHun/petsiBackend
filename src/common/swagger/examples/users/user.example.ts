import { handleSetHas } from '../handlers/handlers';
import { roleExample } from '../roles/role.example';

export function userExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(userExample.name);
  return {
    id: 1,

    createdAt: new Date(),

    updatedAt: new Date(),

    name: 'jim',

    email: 'jim@email.com',

    roles: [handleSetHas(shallow, fnSet, roleExample, false)],
  };
}
