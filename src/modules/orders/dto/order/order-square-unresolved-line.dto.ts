import { ApiProperty } from '@nestjs/swagger';
import { SQUARE_UNRESOLVED_LINE_REASONS } from '../../../square/entities/square-unresolved-line.entity';

export class OrderSquareModifierDto {
    @ApiProperty({ type: 'string', nullable: true, example: 'GHJK4567' })
    readonly squareModifierId: string | null;

    @ApiProperty({ type: 'string', nullable: true, example: 'Chocolate Chip' })
    readonly name: string | null;

    @ApiProperty({ example: 1 })
    readonly quantity: number;
}

/**
 * A pending Square line Petsi couldn't place on the order: a placeholder row
 * shown next to the order's real items.
 */
export class OrderSquareUnresolvedLineDto {
    @ApiProperty({ example: 1 })
    readonly id: number;

    @ApiProperty({ example: '8sD2kPq1' })
    readonly squareLineUid: string;

    @ApiProperty({
        type: 'string',
        nullable: true,
        description: 'Null for an ad-hoc line',
        example: 'XYZ123',
    })
    readonly squareVariationId: string | null;

    @ApiProperty({ type: 'string', nullable: true, example: 'Apple Pie' })
    readonly squareItemName: string | null;

    @ApiProperty({ type: 'string', nullable: true, example: 'Large' })
    readonly squareVariationName: string | null;

    @ApiProperty({ type: [OrderSquareModifierDto] })
    readonly squareModifiers: OrderSquareModifierDto[];

    @ApiProperty({
        enum: SQUARE_UNRESOLVED_LINE_REASONS,
        example: 'unmapped_variation',
    })
    readonly reason: string;

    @ApiProperty({ example: 2 })
    readonly quantity: number;

    @ApiProperty({ type: 'string', nullable: true, example: 'no nuts' })
    readonly note: string | null;
}
