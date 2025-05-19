import { TestingModule } from "@nestjs/testing";
import { CreateInventoryAreaDto } from "../dto/inventory-area/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/inventory-area/update-inventory-area.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaService } from "../services/inventory-area.service";
import { AREA_A, AREA_B, AREA_C, AREA_D } from "../utils/constants";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaController } from "./inventory-area.controller";
import { AppHttpException } from "../../../util/exceptions/AppHttpException";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe('inventory area controller', () => {
    let controller: InventoryAreaController;
    let areaService: InventoryAreaService;

    let areas: InventoryArea[];
    let areaId = 1;
    let areaCounts: InventoryAreaCount[];
    let countId = 1;
    let idToRemove: number;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        
        controller = module.get<InventoryAreaController>(InventoryAreaController);
        areaService = module.get<InventoryAreaService>(InventoryAreaService);

        areas = [
            { areaName: AREA_A } as InventoryArea,
            { areaName: AREA_B } as InventoryArea,
            { areaName: AREA_C } as InventoryArea,
            { areaName: AREA_D } as InventoryArea,
        ];
        areas.map(area => area.id = areaId++);

        areaCounts = [
            { inventoryArea: areas[0], countDate: new Date() } as InventoryAreaCount,
            { inventoryArea: areas[0], countDate: new Date() } as InventoryAreaCount,

            { inventoryArea: areas[1], countDate: new Date() } as InventoryAreaCount,
            { inventoryArea: areas[1], countDate: new Date() } as InventoryAreaCount,

            { inventoryArea: areas[2], countDate: new Date() } as InventoryAreaCount,
            { inventoryArea: areas[2], countDate: new Date() } as InventoryAreaCount,

            { inventoryArea: areas[3], countDate: new Date() } as InventoryAreaCount,
            { inventoryArea: areas[3], countDate: new Date() } as InventoryAreaCount,
        ];
        areaCounts.map(count => count.id = countId++);

        areas[0].inventoryCounts = [ areaCounts[0], areaCounts[1] ];
        areas[1].inventoryCounts = [ areaCounts[2], areaCounts[3] ];
        areas[2].inventoryCounts = [ areaCounts[4], areaCounts[5] ];
        areas[3].inventoryCounts = [ areaCounts[6], areaCounts[7] ];
        
        jest.spyOn(areaService, "create").mockImplementation(async (createDto: CreateInventoryAreaDto) => {
            const exists = areas.findIndex(a => a.areaName === createDto.areaName);
            if(exists !== -1){ throw new BadRequestException(); }

            const newArea = { areaName: createDto.areaName } as InventoryArea;

            newArea.id = areaId++;
            areas.push(newArea);
            return newArea;
        });
            
        jest.spyOn(areaService, "findOneByName").mockImplementation(async (name: string) => {
            return areas.find(a => a.areaName === name) || null;
        });
        
        jest.spyOn(areaService, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryAreaDto) => {
            const idx = areas.findIndex(a => a.id === id);
            if(idx === -1){ throw new NotFoundException(); }

            const toUpdate = areas[idx];
            if(updateDto.areaName){
                toUpdate.areaName = updateDto.areaName;
            }
            if(updateDto.inventoryCountIds){
                toUpdate.inventoryCounts = areaCounts.filter(
                    count => updateDto.inventoryCountIds?.findIndex(
                        id => id === count.id) !== -1);
            }
            areas[idx] = toUpdate;
            return toUpdate;
        });
    
        jest.spyOn(areaService, "findAll").mockResolvedValue({items: areas});
    
        jest.spyOn(areaService, "findOne").mockImplementation(async (id: number) => {
            const result = areas.find(area => area.id === id)
            if(!result){
                throw new NotFoundException();
            }
            return result;
        });
    
        jest.spyOn(areaService, "remove").mockImplementation( async (id: number) => {
            
            const index = areas.findIndex(area => area.id === id);
            if(index === -1) throw new NotFoundException();

            areas.splice(index,1);
            return true;
        });
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create an area', async () => {
        const dto = { areaName: "testArea" } as CreateInventoryAreaDto;
        const result = await controller.create(dto);
        expect(result).not.toBeNull();
    });
    
    it('should fail to create an area (already exists)', async () => {
        const dto = { areaName: "testArea" } as CreateInventoryAreaDto;
        await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should return all areas', async () => {
        const result = await controller.findAll();
        expect(result.items.length).toEqual(areas.length);
    });
    
    it('should return an area by id', async () => {
        const result = await controller.findOne(1);
        expect(result).not.toBeNull();
    });
    
    it('should fail to return an area (bad id, returns null)', async () => {
        await expect(controller.remove(0)).rejects.toThrow(NotFoundException);
    });
    
    it('should update an area', async () => {
        const toUpdate = await areaService.findOneByName(AREA_A);
        if(!toUpdate?.id){ throw new Error('area id is null'); }

        const newCount =  { inventoryArea: toUpdate, countDate: new Date() } as InventoryAreaCount;
        newCount.id = countId++;
        if(!toUpdate.inventoryCounts){
            toUpdate.inventoryCounts = [];
        }
        toUpdate?.inventoryCounts.push(newCount);

        const result = await controller.update(toUpdate?.id, toUpdate);
        expect(result).not.toBeNull();
        expect(result?.inventoryCounts?.length).toEqual(toUpdate.inventoryCounts.length);
    });
    
    it('should fail to update an area (doesnt exist)', async () => {
        const toUpdate = await areaService.findOneByName(AREA_A);
        if(!toUpdate?.id){ throw new Error('area id is null'); }

        await expect(controller.update(0, toUpdate)).rejects.toThrow(NotFoundException);
    });
    
    it('should remove an area', async () => {
        const toRemove = await areaService.findOneByName(AREA_A);
        if(!toRemove){ throw new Error('area to remove is null'); }
        
        const result = await controller.remove(toRemove.id);
        expect(result).toBeUndefined();

        idToRemove = toRemove.id
    });

    it('should fail to remove an area (id not found)', async () => {
        await expect(controller.remove(idToRemove)).rejects.toThrow(NotFoundException);
    });
});