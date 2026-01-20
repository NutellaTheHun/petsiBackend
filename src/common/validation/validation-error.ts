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

export class ValidationErrorMap {
  children: Map<string, ValidationErrorMap[]>;
  id?: string | number;
  errMessage?: string;

  constructor(id: string | number, errMessage?: string) {
    this.id = id;
    this.errMessage = errMessage;
    this.children = new Map();
  }

  public addChild(field: string, child: ValidationErrorMap) {
    const currentChildren = this.children.get(field);
    if (currentChildren) {
      currentChildren.push(child);
    } else {
      this.children.set(field, [child]);
    }
  }

  public addChildren(field: string, children: ValidationErrorMap[]) {
    const currentChildren = this.children.get(field);
    if (currentChildren) {
      currentChildren.push(...children);
    } else {
      this.children.set(field, children);
    }
  }
}
