import { unitOfMeasureCategoryExample } from './unit-of-measure-category.example';

export function unitOfMeasureExample(fnSet: Set<string>) {
  fnSet.add(unitOfMeasureExample.name);
  return {
    id: 1,
    name: 'pound',
    abbreviation: 'lbs',
    category: fnSet.has(unitOfMeasureCategoryExample.name)
      ? undefined
      : unitOfMeasureCategoryExample(fnSet),
  };
}
