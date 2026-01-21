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
    children: ValidationErrorNode[] = [],
  ) {
    this.field = field;
    this.id = id;
    this.message = message;
    this.children = children;
  }

  field: string;

  id?: string | number;

  message?: string;

  children: ValidationErrorNode[];

  public addChild(err: ValidationErrorNode) {
    this.children.push(err);
  }

  public addChildren(errs: ValidationErrorNode[]) {
    if (!errs || errs.length === 0) return;
    this.children.push(...errs);
  }

  public addFieldError(field: string, message: string, id?: string | number) {
    this.addChild(new ValidationErrorNode(field, id, message));
  }

  /**
   * Returns true if ValidationErrorNode has no message, and no children.
   *
   * validationErrorNode with only a field is considered empty.
   *
   * Id is not considered for empty or not.
   */
  public isEmpty(): boolean {
    const noMessage = !this.message;
    const noChildren = this.children?.length === 0;
    return noMessage && noChildren;
  }
}

export type ValidationErrorResponse = {
  id?: string | number;
  message?: string;
  errors?: Record<string, ValidationErrorResponse[]>;
};

export class ValidationErrorMap {
  private children: Map<string, ValidationErrorMap[]>;
  id?: string | number;
  errMessage?: string | null;

  constructor(id?: string | number, errMessage?: string | null) {
    this.id = id;
    this.errMessage = errMessage ?? null;
  }

  public addChild(field: string, child: ValidationErrorMap) {
    if (!this.children) {
      this.children = new Map();
    }
    const list = this.children.get(field) ?? [];
    list.push(child);
    this.children.set(field, list);
  }

  public addChildren(field: string, children: ValidationErrorMap[]) {
    if (!this.children) {
      this.children = new Map();
    }
    const list = this.children.get(field) ?? [];
    list.push(...children);
    this.children.set(field, list);
  }

  public isEmpty(): boolean {
    const hasMessage = !!this.errMessage;
    const hasChildren = !!this.children && this.children.size > 0;
    return !hasMessage && !hasChildren;
  }

  public getResult(): ValidationErrorResponse {
    const result: ValidationErrorResponse = {};

    if (this.id !== undefined) {
      result.id = this.id;
    }

    if (this.errMessage) {
      result.message = this.errMessage;
    }

    if (this.children && this.children.size > 0) {
      const errors: Record<string, ValidationErrorResponse[]> = {};

      for (const [field, children] of this.children.entries()) {
        errors[field] = children.map((child) => child.getResult());
      }

      result.errors = errors;
    }

    return result;
  }
}
