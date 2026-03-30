import { ApiProperty } from '@nestjs/swagger';
import { ChangeLogDto } from './change-log.dto';

export class RevisionHistoryDetailDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    revisionNumber: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ type: () => ChangeLogDto })
    changeLog: ChangeLogDto;

    @ApiProperty({
        type: 'object',
        additionalProperties: true,
        description: 'Versioned aggregate snapshot (shape depends on entity type and payloadVersion)',
    })
    payload: Record<string, unknown>;
}
