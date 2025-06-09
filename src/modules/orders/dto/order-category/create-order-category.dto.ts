import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderCategoryDto {
  @ApiProperty({
    description: 'Name of the OrderCategory entity.',
    example: 'Wholesale',
  })
  @IsString()
  @IsNotEmpty()
  readonly categoryName: string;
}
