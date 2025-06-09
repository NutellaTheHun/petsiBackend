import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: '', example: 'jsmith123' })
  @IsString()
  @IsOptional()
  readonly username?: string;

  @ApiProperty({ description: '', example: 'jjsmithy@email.com' })
  @IsString()
  @IsOptional()
  readonly email?: string | null;

  @ApiProperty({ description: '', example: 'strongPassword1234' })
  @IsString()
  @IsOptional()
  readonly password?: string;

  @ApiProperty({
    description: 'Id of roles the user has.',
    example: [1, 2],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @IsOptional()
  readonly roleIds?: number[];
}
