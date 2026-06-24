import { UnitConversionError, convertUnit } from './convert';

describe('convertUnit', () => {
  describe('valid same-category conversions', () => {
    it('converts kg to lb', () => {
      expect(convertUnit(1, 'kg', 'lb')).toBeCloseTo(2.20462, 4);
    });

    it('converts lb to kg', () => {
      expect(convertUnit(2.20462, 'lb', 'kg')).toBeCloseTo(1, 4);
    });

    it('converts cup to ml', () => {
      expect(convertUnit(1, 'cup', 'ml')).toBeCloseTo(236.588, 2);
    });

    it('converts same unit to itself', () => {
      expect(convertUnit(5, 'g', 'g')).toBeCloseTo(5, 5);
    });
  });

  describe('ea → ea', () => {
    it('returns value unchanged', () => {
      expect(convertUnit(7, 'ea', 'ea')).toBe(7);
    });

    it('returns zero unchanged', () => {
      expect(convertUnit(0, 'ea', 'ea')).toBe(0);
    });
  });

  describe('cross-category conversions', () => {
    it('throws UnitConversionError for kg → cup', () => {
      expect(() => convertUnit(1, 'kg', 'cup')).toThrow(UnitConversionError);
    });

    it('throws UnitConversionError for ml → oz', () => {
      expect(() => convertUnit(1, 'ml', 'oz')).toThrow(UnitConversionError);
    });
  });

  describe('conversions involving ea', () => {
    it('throws UnitConversionError for ea → kg', () => {
      expect(() => convertUnit(1, 'ea', 'kg')).toThrow(UnitConversionError);
    });

    it('throws UnitConversionError for kg → ea', () => {
      expect(() => convertUnit(1, 'kg', 'ea')).toThrow(UnitConversionError);
    });

    it('throws UnitConversionError for ea → cup', () => {
      expect(() => convertUnit(1, 'ea', 'cup')).toThrow(UnitConversionError);
    });
  });
});
