import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInventoryItemVendorDto {
  @ApiProperty({
    description: 'Name of InventoryItemVendor entity.',
    example: 'Driscols',
  })
  @IsString()
  @IsOptional()
  readonly vendorName?: string;
}
