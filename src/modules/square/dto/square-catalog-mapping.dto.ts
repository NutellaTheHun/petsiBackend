import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsOptional,
    IsPositive,
    ValidateIf,
} from 'class-validator';
import {
    SQUARE_MODIFIER_KINDS,
    SquareModifierKind,
} from '../entities/square-modifier-link.entity';
import {
    SQUARE_MODIFIER_MODES,
    SquareModifierMode,
} from '../entities/square-variation-link.entity';
import { SquareSizeAliasDto } from './square-catalog.dto';

export class UpdateSquareItemHintDto {
    @ApiProperty({
        type: Number,
        nullable: true,
        example: 12,
        description:
            "Menu item the item's derived variation links take; null clears the hint",
    })
    @ValidateIf((dto: UpdateSquareItemHintDto) => dto.menuItemId !== null)
    @IsInt()
    @IsPositive()
    menuItemId: number | null;
}

export class UpdateSquareSizeAliasDto {
    @ApiProperty({
        type: Number,
        nullable: true,
        example: 4,
        description:
            'Petsi size this Square variation name means; null clears the alias',
    })
    @ValidateIf((dto: UpdateSquareSizeAliasDto) => dto.menuItemSizeId !== null)
    @IsInt()
    @IsPositive()
    menuItemSizeId: number | null;
}

/**
 * A manual override of one variation link. Omitted fields keep their current
 * value; any change makes the link `manual`.
 */
export class UpdateSquareVariationLinkDto {
    @ApiPropertyOptional({ type: Number, nullable: true, example: 12 })
    @IsOptional()
    @ValidateIf((dto: UpdateSquareVariationLinkDto) => dto.menuItemId !== null)
    @IsInt()
    @IsPositive()
    menuItemId?: number | null;

    @ApiPropertyOptional({ type: Number, nullable: true, example: 4 })
    @IsOptional()
    @ValidateIf(
        (dto: UpdateSquareVariationLinkDto) => dto.menuItemSizeId !== null,
    )
    @IsInt()
    @IsPositive()
    menuItemSizeId?: number | null;

    @ApiPropertyOptional({ enum: SQUARE_MODIFIER_MODES, example: 'none' })
    @IsOptional()
    @IsIn(SQUARE_MODIFIER_MODES)
    modifierMode?: SquareModifierMode;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;
}

export class UpdateSquareCategoryLinkEnabledDto {
    @ApiProperty({
        example: false,
        description:
            "Also sets `enabled` on the category's non-manual variation links, and the starting `enabled` of new ones",
    })
    @IsBoolean()
    enabled: boolean;
}

/**
 * A modifier link's mapping as a whole: map (`item` with both ids), clear
 * (`item` with neither) or ignore. Applies to its non-manual siblings too.
 */
export class UpdateSquareModifierLinkMappingDto {
    @ApiProperty({ enum: SQUARE_MODIFIER_KINDS, example: 'item' })
    @IsIn(SQUARE_MODIFIER_KINDS)
    kind: SquareModifierKind;

    @ApiPropertyOptional({
        type: Number,
        nullable: true,
        example: 31,
        description: 'A SINGLE menu item; omit or null to clear or ignore',
    })
    @IsOptional()
    @ValidateIf(
        (dto: UpdateSquareModifierLinkMappingDto) => dto.menuItemId !== null,
    )
    @IsInt()
    @IsPositive()
    menuItemId?: number | null;

    @ApiPropertyOptional({ type: Number, nullable: true, example: 2 })
    @IsOptional()
    @ValidateIf(
        (dto: UpdateSquareModifierLinkMappingDto) =>
            dto.menuItemSizeId !== null,
    )
    @IsInt()
    @IsPositive()
    menuItemSizeId?: number | null;
}

export class UpdateSquareModifierLinkEnabledDto {
    @ApiProperty({
        example: false,
        description: 'Disabled modifiers are skipped on import',
    })
    @IsBoolean()
    enabled: boolean;
}

export class MarkSquareLinksReviewedDto {
    @ApiPropertyOptional({ type: [Number], example: [1, 2] })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    variationLinkIds?: number[];

    @ApiPropertyOptional({ type: [Number], example: [3] })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    modifierLinkIds?: number[];
}

/** Size aliases whose names differ only in their "serves N" text. */
export class SquareSizeAliasSuggestionDto {
    @ApiProperty({
        example: 'large 10"',
        description: 'The shared name, without the "serves N" text',
    })
    baseName: string;

    @ApiProperty({ type: [SquareSizeAliasDto] })
    aliases: SquareSizeAliasDto[];
}
