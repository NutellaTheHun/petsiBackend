import { ApiProperty } from '@nestjs/swagger';

/** What an import or re-sync of one Square location did, by order count. */
export class SquareLocationImportResultDto {
    @ApiProperty({
        example: 12,
        description:
            'Open/completed pickup and delivery orders Square returned for the location',
    })
    found: number;

    @ApiProperty({
        example: 4,
        description:
            'Left out because they were due before today (location time)',
    })
    pastDue: number;

    @ApiProperty({ example: 6, description: 'New Petsi orders' })
    created: number;

    @ApiProperty({
        example: 1,
        description: 'Existing Petsi orders updated to a newer Square version',
    })
    updated: number;

    @ApiProperty({
        example: 1,
        description: 'Already imported at this Square version',
    })
    unchanged: number;

    @ApiProperty({
        example: 0,
        description: 'Not imported by ingest (e.g. detached, draft, cancelled)',
    })
    skipped: number;

    @ApiProperty({
        example: 0,
        description: 'Rejected by Petsi order validation',
    })
    rejected: number;
}
