import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { InventoryItemSizesService } from "../services/inventory-items-sizes.service";
import { ControllerBase } from "../../../base/controller-base";

export class InventoryItemSizesController extends ControllerBase<InventoryItemSize> {
    constructor(
      sizesService: InventoryItemSizesService
    ){ super(sizesService); }
}