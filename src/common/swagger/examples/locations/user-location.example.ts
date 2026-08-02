import { handleSetHas } from '../handlers/handlers';
import { roleExample } from '../roles/role.example';
import { userExample } from '../users/user.example';

export function userLocationExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(userLocationExample.name);
  return {
    id: 1,

    locationId: 1,

    user: handleSetHas(shallow, fnSet, userExample, false),

    roles: [handleSetHas(shallow, fnSet, roleExample, false)],
  };
}
