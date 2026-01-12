import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateInventoryAreaDto {
  @ApiProperty({
    description: 'Name of the inventory area.',
    example: 'Dry Storage',
  })
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
