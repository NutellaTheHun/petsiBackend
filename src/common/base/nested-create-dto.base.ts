import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Base class for nested create DTOs. Holds the createId of the nested create DTO.
 * Nested items are routed to the create or update DTO by the presence of `createId`;
 * one with neither `createId` nor `id` lands on `NestedUpdateDto` and fails its `id` rule,
 * so it's rejected as a shape failure before any validator runs.
 */
export class NestedCreateDto {
    @IsString()
    @IsNotEmpty()
    readonly createId: string;
}
