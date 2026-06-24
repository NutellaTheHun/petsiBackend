import convert = require('convert-units');
import type { AppUnit } from './constants';

export class UnitConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnitConversionError';
  }
}

export function convertUnit(value: number, from: AppUnit, to: AppUnit): number {
  if (from === 'ea' && to === 'ea') {
    return value;
  }

  if (from === 'ea' || to === 'ea') {
    throw new UnitConversionError(
      `Cannot convert between 'ea' and '${from === 'ea' ? to : from}'`,
    );
  }

  try {
    return convert(value).from(from).to(to);
  } catch (err) {
    throw new UnitConversionError(
      `Cannot convert from '${from}' to '${to}': ${(err as Error).message}`,
    );
  }
}
