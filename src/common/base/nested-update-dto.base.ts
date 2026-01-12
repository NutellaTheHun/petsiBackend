import { IsNumber } from 'class-validator';

export class NestedUpdateDto {
  @IsNumber()
  readonly id: number;
}
