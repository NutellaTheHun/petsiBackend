import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";
import { NestedUpdate } from "../../../../common/base/nested-update.base";
import { EntityId } from "../../../../common/types";
import { NestedInventoryItemSizeDto } from "../../../inventory-items/dto/inventory-item-size/nested-inventory-item-size.dto";
import { InventoryItemSize } from "../../../inventory-items/entities/inventory-item-size.entity";
import { InventoryItem } from "../../../inventory-items/entities/inventory-item.entity";

export class NestedUpdateInventoryAreaItemDto extends NestedUpdate {
    @ApiPropertyOptional({
        description: 'Id for InventoryItem entity.',
        example: 1,
        type: Number,
      })
      @IsNumber()
      @IsPositive()
      @IsOptional()
      readonly countedInventoryItemId?: EntityId<InventoryItem>;
    
      @ApiPropertyOptional({
        description: 'The amount of InventoryItem per unit.',
        example: 6,
      })
      @IsNumber()
      @IsPositive()
      @IsOptional()
      readonly amount?: number;
    
      @ApiPropertyOptional({
        description:
          'Id for InventoryItemSize entity. If countedItemSizeId is populated, countedItemSizeDto must be null/undefined.',
        example: 2,
        type: Number,
      })
      @IsNumber()
      @IsPositive()
      @IsOptional()
      readonly countedItemSizeId?: EntityId<InventoryItemSize>;
    
      @ApiPropertyOptional({
        description:
          'If countedItemSizeDto is populated, countedItemSizeId must be null/undefined.',
        type: NestedInventoryItemSizeDto,
        example: {
          mode: 'update',
          id: 5,
          updateDto: {
            measureTypeId: 1,
            measureAmount: 2,
            packageId: 3,
            cost: 4,
          },
        },
      })
      @IsOptional()
      readonly countedItemSize?: NestedInventoryItemSizeDto;
}