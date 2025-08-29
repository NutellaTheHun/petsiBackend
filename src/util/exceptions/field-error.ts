export class FieldError<T, K extends keyof T> {
  readonly field: K;
  readonly id?: string;
  readonly message: string;
}
