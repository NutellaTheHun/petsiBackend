import { handleSetHas } from '../handlers/handlers';

export function roleExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(roleExample.name);
  return {
    id: 1,

    roleName: 'staff',

    users: [handleSetHas(shallow, fnSet, roleExample, false)],
  };
}
