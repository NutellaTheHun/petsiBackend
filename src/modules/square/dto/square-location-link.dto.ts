import { ApiProperty } from '@nestjs/swagger';

/** A Square location and how the tenant has mapped it. */
export class SquareLocationLinkDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'L8ZJ1S4ABCDEF' })
    squareLocationId: string;

    @ApiProperty({ example: 'Petsi Pies Somerville' })
    squareName: string;

    @ApiProperty({
        type: String,
        nullable: true,
        example: 'ACTIVE',
        description: "Square's location status (ACTIVE / INACTIVE)",
    })
    squareStatus: string | null;

    @ApiProperty({
        type: String,
        nullable: true,
        example: 'America/New_York',
    })
    timezone: string | null;

    @ApiProperty({
        example: false,
        description: "Whether this location's orders are imported",
    })
    enabled: boolean;

    @ApiProperty({
        type: Number,
        nullable: true,
        example: 3,
        description: 'The Petsi location it maps to, or null when unmapped',
    })
    locationId: number | null;
}
