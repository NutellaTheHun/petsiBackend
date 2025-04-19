import { Controller } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";

/**
 * Create: (inventoryAreaId: number)
 * Update: (inventoryAreaId: number, inventoryAreaItemIds: number[]) 
 * note: inserting inventoryAreaItems automatically updates the inventoryAreaCount
 */
@Controller('inventory-area-count')
export class InventoryAreaCountController extends ControllerBase<InventoryAreaCount> {
    constructor(
        private readonly areaCountService: InventoryAreaCountService,
    ) { super(areaCountService); }
}