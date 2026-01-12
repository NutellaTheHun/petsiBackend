import { IsNotEmpty } from 'class-validator';

export class NestedCreateDto {
  @IsNotEmpty()
  readonly createId: string;
}
