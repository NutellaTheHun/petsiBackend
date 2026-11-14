import { ApiProperty } from '@nestjs/swagger';

/** What needs a person at one Petsi location. */
export class SquareLocationAttentionDto {
    @ApiProperty({ example: 3 })
    readonly locationId: number;

    @ApiProperty({
        example: 2,
        description: 'Pending unresolved Square lines on its orders',
    })
    readonly pendingLines: number;

    @ApiProperty({ example: 1, description: 'Open Square order issues' })
    readonly openIssues: number;
}

/** Variation and modifier link counts. */
export class SquareLinkCountsDto {
    @ApiProperty({ example: 4 })
    readonly variations: number;

    @ApiProperty({ example: 0 })
    readonly modifiers: number;
}

/** The attention queue's counts; locations with nothing pending are left out. */
export class SquareAttentionDto {
    @ApiProperty({
        type: [SquareLocationAttentionDto],
        description: 'Only locations whose orders the caller can read',
    })
    readonly locations: SquareLocationAttentionDto[];

    @ApiProperty({
        type: SquareLinkCountsDto,
        description:
            'Tenant-wide: enabled, live links that have no Petsi mapping yet',
    })
    readonly unmappedLinks: SquareLinkCountsDto;

    @ApiProperty({
        type: SquareLinkCountsDto,
        description: 'Tenant-wide: live links nobody has reviewed yet',
    })
    readonly unreviewedLinks: SquareLinkCountsDto;
}
