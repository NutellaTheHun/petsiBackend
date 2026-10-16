import { IsInt, IsPositive } from 'class-validator';

/**
 * Base class for nested update DTOs. A nested item with neither `createId` nor `id`
 * is transformed into this class and fails here (see `NestedCreateDto`).
 */
export class NestedUpdateDto {
    @IsInt()
    @IsPositive()
    readonly id: number;
}
