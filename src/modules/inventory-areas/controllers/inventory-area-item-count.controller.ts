import { Controller } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryAreaItemCountService } from "../services/inventory-area-item-count.service";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";

@Controller('inventory-area-item-count')
export class InventoryAreaItemCountController extends ControllerBase<InventoryAreaItemCount> {
    constructor(
        private readonly itemCountService: InventoryAreaItemCountService
    ){ super(itemCountService); }
}