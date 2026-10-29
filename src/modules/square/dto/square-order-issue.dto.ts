import { ApiProperty } from '@nestjs/swagger';
import {
    SQUARE_ORDER_ISSUE_REASONS,
    SQUARE_ORDER_ISSUE_STATUSES,
    SquareOrderIssueDetail,
    SquareOrderIssueReason,
    SquareOrderIssueStatus,
} from '../entities/square-order-issue.entity';

/** A Square order Petsi couldn't accept, and what's being done about it. */
export class SquareOrderIssueDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'CAISEM9jK2T0rQKfT8jZ' })
    squareOrderId: string;

    @ApiProperty({ example: 'L8ZJ1S4ABCDEF' })
    squareLocationId: string;

    @ApiProperty({
        type: Number,
        nullable: true,
        example: 3,
        description: 'The Petsi location the order belongs to',
    })
    locationId: number | null;

    @ApiProperty({
        type: Number,
        nullable: true,
        example: null,
        description: 'The Petsi order, once one exists',
    })
    orderId: number | null;

    @ApiProperty({
        example: '4',
        description: 'The Square order version last attempted (a bigint)',
    })
    squareVersion: string;

    @ApiProperty({ enum: SQUARE_ORDER_ISSUE_REASONS })
    reason: SquareOrderIssueReason;

    @ApiProperty({
        type: 'object',
        nullable: true,
        additionalProperties: true,
        example: {
            validationErrors: {
                errorPayload: [
                    { errorCode: 'MISSING_PROPERTY', fields: ['recipient'] },
                ],
            },
        },
        description:
            "For validation_failed, the order validator's error tree under validationErrors; for refund_received, the returned lines and amount under refund",
    })
    detail: SquareOrderIssueDetail | null;

    @ApiProperty({ enum: SQUARE_ORDER_ISSUE_STATUSES })
    status: SquareOrderIssueStatus;

    @ApiProperty({ type: Date })
    lastAttemptAt: Date;

    @ApiProperty({ type: Date })
    createdAt: Date;
}
