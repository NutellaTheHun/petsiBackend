import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateInventoryItemPackageDto {
  @ApiProperty({
    example: 'Box',
    description: 'Name for InventoryItemPackage entity.',
  })
  @IsString()
  @IsNotEmpty()
  readonly packageName: string;
}
