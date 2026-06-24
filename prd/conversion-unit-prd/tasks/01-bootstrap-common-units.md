status: done
blocked-by: []

---

## Source

prd/conversion-unit-prd.md

## What to build

Install the `convert-units` npm package and create `src/common/units/` with three files:

- `constants.ts` — a `UNITS` const object covering the supported subset of unit symbols: weight (`kg`, `g`, `lb`, `oz`), volume (`Tbs`, `tsp`, `cup`, `ml`, `l`, `gal`, `fl-oz`, `qt`, `pnt`), and a dimensionless/count unit (`ea`). Also exports the `AppUnit` type, which is the `convert-units` package `Unit` type unioned with `'ea'`.
- `convert.ts` — a `convertUnit(value: number, from: AppUnit, to: AppUnit): number` function wrapping `convert-units`. `ea → ea` is a no-op returning value unchanged. Any other conversion involving `ea`, or any cross-category conversion, throws `UnitConversionError` — a plain `Error` subclass with no HTTP semantics.
- `index.ts` — re-exports everything from the above two files.

Include unit tests for `convertUnit` covering: valid same-category conversions, the `ea → ea` no-op, cross-category throws `UnitConversionError`, and `ea → measurable` throws `UnitConversionError`.

## Acceptance criteria

- [x] `convert-units` is installed as a production dependency
- [x] `AppUnit` type is exported and equals `Unit | 'ea'` where `Unit` comes from `convert-units`
- [x] `UNITS` const object covers all units listed above and values are valid `AppUnit` symbols
- [x] `convertUnit` returns the correct numeric result for valid same-category conversions
- [x] `convertUnit` returns the input value unchanged for `ea → ea`
- [x] `convertUnit` throws `UnitConversionError` for cross-category conversions (e.g. `kg → cup`)
- [x] `convertUnit` throws `UnitConversionError` when either unit is `ea` and the other is not
- [x] All new unit tests pass
