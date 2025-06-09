import { ApiProperty } from '@nestjs/swagger';
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
  readonly username: string;

  @ApiProperty({ description: '', example: 'jjsmithy@email.com' })
  @IsString()
  @IsOptional()
  readonly email?: string;

  @ApiProperty({ description: '', example: 'strongPassword1234' })
  @IsString()
  @IsNotEmpty()
  readonly password: string;

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
