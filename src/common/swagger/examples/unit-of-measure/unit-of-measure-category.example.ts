import { handleSetHas } from '../handlers/handlers';
import { unitOfMeasureExample } from './unit-of-measure.example';

export function unitOfMeasureCategoryExample(
  fnSet: Set<string>,
  shallow: boolean,
) {
  fnSet.add(unitOfMeasureCategoryExample.name);
  return {
    id: 1,

    categoryName: 'Weight',

    unitsOfMeasure: [handleSetHas(shallow, fnSet, unitOfMeasureExample, false)],
  };
}
