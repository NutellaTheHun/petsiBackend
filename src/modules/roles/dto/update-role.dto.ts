import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Name of the Role entity.',
    example: 'manager',
  })
  @IsString()
  @IsOptional()
  readonly roleName?: string;
}
