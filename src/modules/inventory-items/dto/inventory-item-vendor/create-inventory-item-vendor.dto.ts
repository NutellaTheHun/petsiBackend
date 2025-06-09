import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateInventoryItemVendorDto {
  @ApiProperty({
    description: 'Name of InventoryItemVendor entity.',
    example: 'Cysco',
  })
  @IsString()
  @IsNotEmpty()
  readonly vendorName: string;
}
