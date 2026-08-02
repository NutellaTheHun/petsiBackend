import { handleSetHas } from '../handlers/handlers';
import { userLocationExample } from '../locations/user-location.example';

export function roleExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(roleExample.name);
  return {
    id: 1,

    name: 'staff',

    userLocations: [handleSetHas(shallow, fnSet, userLocationExample, false)],
  };
}
