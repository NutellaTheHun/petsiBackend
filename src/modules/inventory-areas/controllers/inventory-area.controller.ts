import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaService } from "../services/inventory-area.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Controller('inventory-area')
export class InventoryAreaController extends ControllerBase<InventoryArea> {
    constructor(
        areaService: InventoryAreaService,
        @Inject(CACHE_MANAGER) cacheManager: Cache
    ){ super(areaService, cacheManager); }
}