import { unitOfMeasureExample } from './unit-of-measure.example';

export function unitOfMeasureCategoryExample(fnSet: Set<string>) {
  fnSet.add(unitOfMeasureCategoryExample.name);
  return {
    id: 1,
    categoryName: 'Weight',
    unitsOfMeasure: fnSet.has(unitOfMeasureExample.name)
      ? undefined
      : unitOfMeasureExample(fnSet),
  };
}
