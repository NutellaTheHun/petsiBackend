import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsOptional,
    IsPositive,
    ValidateIf,
} from 'class-validator';
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

export class MarkSquareLinksReviewedDto {
    @ApiProperty({ type: [Number], example: [1, 2] })
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    variationLinkIds: number[];
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
