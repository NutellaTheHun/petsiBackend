import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { EntityId } from '../../../common/types';
import { Role } from '../../roles/entities/role.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '', example: 'jsmith123' })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiPropertyOptional({ description: '', example: 'strongPassword1234' })
  @IsString()
  @IsOptional()
  readonly password?: string;

  @ApiPropertyOptional({
    description: '',
    example: 'jjsmithy@email.com',
    type: 'string',
    format: 'email',
  })
  @IsString()
  @IsOptional()
  readonly email?: string;

  @ApiPropertyOptional({
    description: 'Id of roles the user has.',
    example: [1, 2],
    type: 'number',
    isArray: true,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @IsOptional()
  @Type(() => Number)
  readonly roleIds?: EntityId<Role>[];
}
