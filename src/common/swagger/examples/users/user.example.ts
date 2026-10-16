export function userExample(fnSet: Set<string>, _shallow: boolean) {
  fnSet.add(userExample.name);
  return {
    id: 1,

    createdAt: new Date(),

    updatedAt: new Date(),

    name: 'jim',

    email: 'jim@email.com',
  };
}
