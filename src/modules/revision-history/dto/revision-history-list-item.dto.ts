import { ApiProperty } from '@nestjs/swagger';
import { ChangeLogDto } from './change-log.dto';

export class RevisionHistoryListItemDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    revisionNumber: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ type: () => ChangeLogDto })
    changeLog: ChangeLogDto;
}
