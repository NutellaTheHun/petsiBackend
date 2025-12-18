import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '', example: 'jsmith123' })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({ description: '', example: 'strongPassword1234' })
  @IsString()
  @IsNotEmpty()
  readonly password: string;

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
  readonly roleIds?: number[];
}
