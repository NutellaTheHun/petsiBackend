import { IsNotEmpty } from "class-validator";

export class NestedCreate {
  @IsNotEmpty()
  readonly createId: string;
}