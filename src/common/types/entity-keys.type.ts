export type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number | null | undefined ? K : never;
}[keyof T];

export type StringKeys<T> = {
  [K in keyof T]: T[K] extends string | null | undefined ? K : never;
}[keyof T];

export type ArrayKeys<T> = {
  [K in keyof T]: T[K] extends Array<any> ? K : never;
}[keyof T];
