import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '', example: 'jsmith123' })
  @IsString()
  @IsOptional()
  readonly username?: string;

  @ApiPropertyOptional({ description: '', example: 'jjsmithy@email.com' })
  @IsString()
  @IsOptional()
  readonly email?: string | null;

  @ApiPropertyOptional({ description: '', example: 'strongPassword1234' })
  @IsString()
  @IsOptional()
  readonly password?: string;

  @ApiPropertyOptional({
    description: 'Id of roles the user has.',
    example: [1, 2],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @IsOptional()
  readonly roleIds?: number[];
}
