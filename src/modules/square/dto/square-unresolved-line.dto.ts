import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { OrderSquareUnresolvedLineDto } from '../../orders/dto/order/order-square-unresolved-line.dto';
import {
    SQUARE_UNRESOLVED_LINE_REASONS,
    SQUARE_UNRESOLVED_LINE_STATUSES,
    SquareUnresolvedLineReason,
    SquareUnresolvedLineStatus,
} from '../entities/square-unresolved-line.entity';

/** An unresolved Square line on the resolution screen. */
export class SquareUnresolvedLineDto extends OrderSquareUnresolvedLineDto {
    @ApiProperty({ type: Number, nullable: true, example: 41 })
    readonly orderId: number | null;

    @ApiProperty({ example: 'CAISEM9jK2T0rQKfT8jZ' })
    readonly squareOrderId: string;

    @ApiProperty({ enum: SQUARE_UNRESOLVED_LINE_STATUSES })
    readonly status: SquareUnresolvedLineStatus;

    @ApiProperty({
        type: Number,
        nullable: true,
        example: null,
        description: 'For an ad-hoc line, the menu item staff mapped it to',
    })
    readonly adHocMenuItemId: number | null;

    @ApiProperty({ type: Number, nullable: true, example: null })
    readonly adHocMenuItemSizeId: number | null;

    @ApiProperty({ type: Date })
    readonly createdAt: Date;
}

/** A modifier on a group's lines that keeps them from being placed. */
export class SquareUnmappedModifierDto {
    @ApiProperty({ type: 'string', nullable: true, example: 'GHJK4567' })
    readonly squareModifierId: string | null;

    @ApiProperty({ type: 'string', nullable: true, example: 'Lemon Glaze' })
    readonly name: string | null;

    @ApiProperty({
        type: Number,
        nullable: true,
        example: 7,
        description:
            'The modifier link to map; null when no catalog sync has seen the modifier yet',
    })
    readonly modifierLinkId: number | null;
}

/**
 * Pending lines that one mapping fix resolves together: a Square product and
 * reason. Ad-hoc lines (no Square product) are one group each.
 */
export class SquareUnresolvedLineGroupDto {
    @ApiProperty({
        example: 'unmapped_variation:XYZ123',
        description:
            'Stable key: `<reason>:<squareVariationId>`, or `ad_hoc:<line id>`',
    })
    readonly key: string;

    @ApiProperty({ enum: SQUARE_UNRESOLVED_LINE_REASONS })
    readonly reason: SquareUnresolvedLineReason;

    @ApiProperty({ type: 'string', nullable: true, example: 'XYZ123' })
    readonly squareVariationId: string | null;

    @ApiProperty({ type: 'string', nullable: true, example: 'Apple Pie' })
    readonly squareItemName: string | null;

    @ApiProperty({ type: 'string', nullable: true, example: 'Large' })
    readonly squareVariationName: string | null;

    @ApiProperty({
        type: Number,
        nullable: true,
        example: 12,
        description:
            'The variation link to map or disable; null for ad-hoc lines and variations no catalog sync has seen',
    })
    readonly variationLinkId: number | null;

    @ApiProperty({
        type: [SquareUnmappedModifierDto],
        description: 'For unmapped_modifier: the modifiers still to map',
    })
    readonly unmappedModifiers: SquareUnmappedModifierDto[];

    @ApiProperty({ type: [SquareUnresolvedLineDto] })
    readonly lines: SquareUnresolvedLineDto[];
}

/** The menu item and size one ad-hoc line becomes. */
export class MapSquareAdHocLineDto {
    @ApiProperty({ example: 12 })
    @IsInt()
    @IsPositive()
    menuItemId: number;

    @ApiProperty({ example: 4 })
    @IsInt()
    @IsPositive()
    menuItemSizeId: number;
}
