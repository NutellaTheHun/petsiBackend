import { IsNumber } from "class-validator";

export class NestedUpdate {
  @IsNumber()
  readonly id: number;
}