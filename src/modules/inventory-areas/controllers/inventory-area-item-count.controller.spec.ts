import { NotImplementedException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { CreateInventoryAreaItemCountDto } from "../dto/create-inventory-area-item-count.dto";
import { UpdateInventoryAreaItemCountDto } from "../dto/update-inventory-area-item-count.dto";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { InventoryAreaItemCountService } from "../services/inventory-area-item-count.service";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaItemCountController } from "./inventory-area-item-count.controller";

describe('inventory area item count controller', () => {
    let controller: InventoryAreaItemCountController;
    let itemCountService: InventoryAreaItemCountService;

    let itemCounts: InventoryAreaItemCount[];
    
    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        controller = module.get<InventoryAreaItemCountController>(InventoryAreaItemCountController);
        itemCountService = module.get<InventoryAreaItemCountService>(InventoryAreaItemCountService);

        itemCounts = [];

        jest.spyOn(itemCountService, "create").mockImplementation(async (createDto: CreateInventoryAreaItemCountDto) => {
            throw new NotImplementedException();
        });
            
        jest.spyOn(itemCountService, "findByAreaName").mockImplementation(async (name: string) => {
            throw new NotImplementedException();
        });

        jest.spyOn(itemCountService, "findByItemName").mockImplementation(async (name: string) => {
            throw new NotImplementedException();
        });
        
        jest.spyOn(itemCountService, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryAreaItemCountDto) => {
            throw new NotImplementedException();
        });
    
        jest.spyOn(itemCountService, "findAll").mockResolvedValue(itemCounts);
    
        jest.spyOn(itemCountService, "findOne").mockImplementation(async (id: number) => {
            throw new NotImplementedException();
        });
    
        jest.spyOn(itemCountService, "remove").mockImplementation( async (id: number) => {
            throw new NotImplementedException();
        });
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create an item count', async () => {

    });
    
    it('should fail to create an item count (already exists)', async () => {

    });

    it('should return all itemCounts', async () => {

    });
    
    it('should return an item count by id', async () => {

    });

    /*
    it('should return an item count by name', async () => {

    });*/
    
    it('should fail to return an item count (bad id, returns null)', async () => {

    });
    
    it('should update an item count', async () => {

    });
    
    it('should fail to update an item count (doesnt exist)', async () => {

    });
    
    it('should remove an item count', async () => {

    });

    it('should fail to remove an item count (id not found, returns false)', async () => {

    });
});

