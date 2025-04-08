import { Controller } from '@nestjs/common';
import { InventoryItemService } from "../services/inventory-item.service";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryItem } from "../entities/inventory-item.entity";

/**
 * Create: 
 * Update: 
 */
@Controller('inventory-item')
export class InventoryItemController extends ControllerBase<InventoryItem> {
    constructor(
        private readonly itemService: InventoryItemService
    ){ super(itemService); }
}
