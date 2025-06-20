import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInventoryItemVendorDto {
  @ApiPropertyOptional({
    description: 'Name of InventoryItemVendor entity.',
    example: 'Driscols',
  })
  @IsString()
  @IsOptional()
  readonly vendorName?: string;
}
