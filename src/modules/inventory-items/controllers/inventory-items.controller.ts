import { Controller } from '@nestjs/common';
import { InventoryItemsService } from "../services/inventory-items.service";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryItem } from "../entities/inventory-item.entity";

@Controller('inventory-items')
export class InventoryItemsController extends ControllerBase<InventoryItem> {
    constructor(
        itemsService: InventoryItemsService
    ){ super(itemsService); }
}
