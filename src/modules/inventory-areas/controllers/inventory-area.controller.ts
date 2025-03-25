import { Controller } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaService } from "../services/inventory-area.service";

@Controller('inventory-area')
export class InventoryAreaController extends ControllerBase<InventoryArea> {
    constructor(
        private readonly areaService: InventoryAreaService
    ){ super(areaService); }
}