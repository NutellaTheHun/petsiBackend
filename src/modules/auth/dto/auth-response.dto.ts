import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({
    description: 'for frontend rendering, not for any authentication reasons',
    example: ['admin', 'staff'],
    type: [String],
  })
  roles: string[];
}
