import { ApiProperty } from '@nestjs/swagger';
import { SQUARE_CONNECTION_STATUSES } from '../entities/square-connection.entity';

export const SQUARE_CONNECTION_STATUS_VALUES = [
    'not_connected',
    ...SQUARE_CONNECTION_STATUSES,
] as const;

export type SquareConnectionStatusValue =
    (typeof SQUARE_CONNECTION_STATUS_VALUES)[number];

/** The tenant's Square connection as the settings screen sees it. No tokens. */
export class SquareConnectionStatusDto {
    @ApiProperty({
        enum: SQUARE_CONNECTION_STATUS_VALUES,
        enumName: 'SquareConnectionStatus',
        example: 'connected',
        description: "'not_connected' when the tenant has never connected",
    })
    status: SquareConnectionStatusValue;

    @ApiProperty({
        type: String,
        nullable: true,
        example: "Petsi's Pies",
        description: 'The Square business name, or null when not connected',
    })
    businessName: string | null;
}
