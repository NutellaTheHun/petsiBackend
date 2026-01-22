import { IsNotEmpty } from 'class-validator';

/**
 * Base class for nested create DTOs. Holds the createId of the nested create DTO.
 */
export class NestedCreateDto {
  @IsNotEmpty()
  readonly createId: string;
}
