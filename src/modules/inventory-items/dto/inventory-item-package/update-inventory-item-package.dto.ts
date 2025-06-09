import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInventoryItemPackageDto {
  @ApiProperty({
    example: 'Can',
    description: 'Name for InventoryItemPackage entity.',
  })
  @IsString()
  @IsOptional()
  readonly packageName?: string;
}
