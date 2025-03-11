import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { ControllerBase } from "../../../base/controller-base";

export class InventoryItemSizeController extends ControllerBase<InventoryItemSize> {
    constructor(
      private readonly sizeService: InventoryItemSizeService
    ){ super(sizeService); }
}