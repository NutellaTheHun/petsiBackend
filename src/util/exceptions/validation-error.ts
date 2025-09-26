export class ValidationError {
  constructor(init?: Partial<ValidationError>) {
    Object.assign(this, init);
  }
  readonly field: string;
  readonly id?: number;
  readonly createId?: string;
  readonly message: string;
  readonly errorType: string;
}

export class ValidationErrorNode {
  constructor(
    field: string,
    id?: string | number,
    message?: string,
    children?: ValidationErrorNode[],
  ) {
    this.field = field;
    this.id = id;
    this.message = message;
    this.children = children ?? [];
  }
  field: string;

  id?: string | number;

  message?: string;

  children?: ValidationErrorNode[];

  public addChild(
    field: string,
    id?: string | number,
    message?: string,
    children?: ValidationErrorNode[],
  ) {
    if (!this.children) {
      this.children = [];
    }
    this.children.push(new ValidationErrorNode(field, id, message, children));
  }
}
