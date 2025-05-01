import { TestingModule } from "@nestjs/testing";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaCountController } from "./inventory-area-count.controller";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";

describe('inventory area count controller', () => {
    let testingUtil: InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;
    let controller: InventoryAreaCountController;
    let countService: InventoryAreaCountService;

    let areas: InventoryArea[];
    let areaId = 1;

    let areaCounts: InventoryAreaCount[];
    let areaCountId = 1;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        dbTestContext = new DatabaseTestContext();
        controller = module.get<InventoryAreaCountController>(InventoryAreaCountController);
        countService = module.get<InventoryAreaCountService>(InventoryAreaCountService);

        areas = await testingUtil.getTestInventoryAreaEntities(dbTestContext);
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
        areaCounts.map(count => count.id = areaCountId++);

        areas[0].inventoryCounts = [ areaCounts[0], areaCounts[1] ];
        areas[1].inventoryCounts = [ areaCounts[2], areaCounts[3] ];
        areas[2].inventoryCounts = [ areaCounts[4], areaCounts[5] ];
        areas[3].inventoryCounts = [ areaCounts[6], areaCounts[7] ];

        jest.spyOn(countService, "create").mockImplementation(async (createDto: CreateInventoryAreaCountDto) => {
            const areaIndex = areas.findIndex(area => area.id == createDto.inventoryAreaId)
            const newCount = { inventoryArea: areas[areaIndex] } as InventoryAreaCount;

            newCount.id = areaCountId++;
            areaCounts.push(newCount);
            if(!areas[areaIndex].inventoryCounts){ areas[areaIndex].inventoryCounts = []; }
            areas[areaIndex].inventoryCounts.push(newCount);
            return newCount;
        });
            
        jest.spyOn(countService, "findByAreaName").mockImplementation(async (name: string) => {
            const area = areas.find(area => area.name === name);
            return area?.inventoryCounts || [];
        });

        jest.spyOn(countService, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryAreaCountDto) => {
            const idx = areaCounts.findIndex(c => c.id === id);
            if(idx === -1){ return null; }

            const toUpdate = areaCounts[idx];
            if(updateDto.inventoryAreaId){
                const oldAreaIdx = areas.findIndex(area => area.id === toUpdate.inventoryArea.id);
                if(oldAreaIdx === -1){ throw new Error('original area not found'); }
                
                if(areas[oldAreaIdx].inventoryCounts){
                areas[oldAreaIdx].inventoryCounts = areas[oldAreaIdx].inventoryCounts.filter(count => count.id !== id);
                }

                const newAreaIdx = areas.findIndex(area => area.id === toUpdate.inventoryArea.id);
                toUpdate.inventoryArea = areas[newAreaIdx];

                if(!areas[newAreaIdx].inventoryCounts){ areas[newAreaIdx].inventoryCounts = []; }
                areas[newAreaIdx].inventoryCounts.push(toUpdate);
            }

            return toUpdate;
        });
    
        jest.spyOn(countService, "findAll").mockResolvedValue({items: areaCounts});
    
        jest.spyOn(countService, "findOne").mockImplementation(async (id: number) => {
            return areaCounts.find(count => count.id === id) || null;
        });
    
        jest.spyOn(countService, "remove").mockImplementation( async (id: number) => {
            const idx = areaCounts.findIndex(count => count.id === id);
            if(idx === -1){ return false; }

            areaCounts.splice(idx, 1);
            return true;
        });
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create an inventory count', async () => {
        const dto = { inventoryAreaId: 1 } as CreateInventoryAreaCountDto;
        const result = await controller.create(dto);
        expect(result).not.toBeNull();
    });

    it('should return all itemCounts', async () => {
        const results = await controller.findAll();
        expect(results.items.length).toEqual(areaCounts.length);
    });
    
    it('should return an inventory count by id', async () => {
        const result = await controller.findOne(1);
        expect(result).not.toBeNull();
    });
    
    it('should fail to return an inventory count (bad id, returns null)', async () => {
        const result = await controller.findOne(0);
        expect(result).toBeNull();
    });
    
    it('should update an inventory count', async () => {
        const toUpdate = await controller.findOne(1);
        if(!toUpdate){ throw new Error('count to update not found'); }

        const uDto = { inventoryAreaId: 2 } as UpdateInventoryAreaCountDto;

        const result = await controller.update(toUpdate.id, uDto);
        expect(result).not.toBeNull();
    });
    
    it('should fail to update an inventory count (doesnt exist)', async () => {
        const uDto = { inventoryAreaId: 2 } as UpdateInventoryAreaCountDto;

        const result = await controller.update(0, uDto);
        expect(result).toBeNull();
    });
    
    it('should remove an inventory count', async () => {
        const removal = await controller.remove(1);
        expect(removal).toBeTruthy();

        const verify = await controller.findOne(1);
        expect(verify).toBeNull();
    });

    it('should fail to remove an inventory count (id not found, returns false)', async () => {
        const removal = await controller.remove(1);
        expect(removal).toBeFalsy();
    });
});