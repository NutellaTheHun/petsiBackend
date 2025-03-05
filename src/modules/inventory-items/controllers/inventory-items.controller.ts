import { Controller } from '@nestjs/common';
import { InventoryItemService } from "../services/inventory-item.service";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryItem } from "../entities/inventory-item.entity";

@Controller('inventory-items')
export class InventoryItemsController extends ControllerBase<InventoryItem> {
    constructor(
        itemsService: InventoryItemService
    ){ super(itemsService); }
}
