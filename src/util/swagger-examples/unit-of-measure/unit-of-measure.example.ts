import { handleSetHas } from '../handlers/handlers';
import { unitOfMeasureCategoryExample } from './unit-of-measure-category.example';

export function unitOfMeasureExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(unitOfMeasureExample.name);
  return {
    id: 1,

    name: 'pound',

    abbreviation: 'lbs',

    category: handleSetHas(shallow, fnSet, unitOfMeasureCategoryExample, false),
  };
}
