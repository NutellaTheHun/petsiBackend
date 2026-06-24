import convert = require('convert-units');

export type AppUnit = convert.Unit | 'ea';

export const UNITS = {
  // Weight
  kg: 'kg',
  g: 'g',
  lb: 'lb',
  oz: 'oz',
  // Volume
  Tbs: 'Tbs',
  tsp: 'tsp',
  cup: 'cup',
  ml: 'ml',
  l: 'l',
  gal: 'gal',
  'fl-oz': 'fl-oz',
  qt: 'qt',
  pnt: 'pnt',
  // Dimensionless
  ea: 'ea',
} as const satisfies Record<string, AppUnit>;
