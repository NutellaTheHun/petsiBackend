import { BadRequestException, NotImplementedException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { CreateInventoryAreaItemDto } from "../dto/inventory-area-item/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/inventory-area-item/update-inventory-area-item.dto";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaItemController } from "./inventory-area-item.controller";

describe('inventory area item controller', () => {
    let controller: InventoryAreaItemController;
    let itemCountService: InventoryAreaItemService;

    let itemCounts: InventoryAreaItem[];
    
    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        controller = module.get<InventoryAreaItemController>(InventoryAreaItemController);
        itemCountService = module.get<InventoryAreaItemService>(InventoryAreaItemService);

        itemCounts = [];

        jest.spyOn(itemCountService, "create").mockImplementation(async (createDto: CreateInventoryAreaItemDto) => {
            throw new NotImplementedException();
        });

        jest.spyOn(itemCountService, "findByItemName").mockImplementation(async (name: string) => {
            throw new NotImplementedException();
        });
        
        jest.spyOn(itemCountService, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryAreaItemDto) => {
            throw new NotImplementedException();
        });
     
        jest.spyOn(itemCountService, "findAll").mockResolvedValue( {items: itemCounts} );
    
        jest.spyOn(itemCountService, "findOne").mockImplementation(async (id?: number) => {
            if(!id){ throw new BadRequestException(); }
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

