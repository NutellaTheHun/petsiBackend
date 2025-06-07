export function labelTypeExample(fnSet: Set<string>) {
  fnSet.add(labelTypeExample.name);
  return {
    id: 1,
    labelTypeName: '4x2',
    labelTypeLength: 400,
    labelTypeWidth: 200,
  };
}
