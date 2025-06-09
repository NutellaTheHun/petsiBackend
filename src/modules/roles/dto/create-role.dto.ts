import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Name of the Role entity.', example: 'staff' })
  @IsString()
  @IsNotEmpty()
  readonly roleName: string;
}
