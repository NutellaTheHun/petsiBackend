import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResult<T> {
  @ApiProperty({ example: [{}], description: 'list of items returned' })
  items: T[];
  @ApiProperty({
    example: '2',
    description: 'cursor to use for pagination',
  })
  nextCursor?: string;
}
