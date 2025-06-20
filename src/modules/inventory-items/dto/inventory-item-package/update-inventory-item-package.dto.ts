import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInventoryItemPackageDto {
  @ApiPropertyOptional({
    example: 'Can',
    description: 'Name for InventoryItemPackage entity.',
  })
  @IsString()
  @IsOptional()
  readonly packageName?: string;
}
