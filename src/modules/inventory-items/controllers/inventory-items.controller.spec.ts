import { TestingModule } from '@nestjs/testing';
import { InventoryItemController } from './inventory-item.controller';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemService } from '../services/inventory-item.service';
import { InventoryItemFactory } from '../factories/inventory-item.factory';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { DRY_A, DRY_B, DRY_C, DRYGOOD_CAT, FOOD_A, FOOD_B, FOOD_C, FOOD_CAT, OTHER_A, OTHER_B, OTHER_C, OTHER_CAT, VENDOR_A, VENDOR_B, VENDOR_C } from "../utils/constants";


describe('Inventory Item Controller', () => {
  let controller: InventoryItemController;
  let service: InventoryItemService;
  let factory: InventoryItemFactory;

  beforeEach(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemController>(InventoryItemController);
    service = module.get<InventoryItemService>(InventoryItemService);
    factory = module.get<InventoryItemFactory>(InventoryItemFactory);

    let items = [
      factory.createEntityInstance({ name: FOOD_A, category: "foodCat", vendor: "vendorA" }),
      factory.createEntityInstance({ name: DRY_A, category: "dryGoodsCat", vendor: "vendorA" }),
      factory.createEntityInstance({ name: OTHER_A, category: "otherCat", vendor: "vendorA" }),

      factory.createEntityInstance({ name: FOOD_B, category: "foodCat", vendor: "vendorB" }),
      factory.createEntityInstance({ name: DRY_B, category: "dryGoodsCat", vendor: "vendorB" }),
      factory.createEntityInstance({ name: OTHER_B, category: "otherCat", vendor: "vendorB" }),
    
      factory.createEntityInstance({ name: FOOD_C, category: "foodCat", vendor: "vendorC" }),
      factory.createEntityInstance({ name: DRY_C, category: "dryGoodsCat", vendor: "vendorC" }),
      factory.createEntityInstance({ name: OTHER_C, category: "otherCat", vendor: "vendorC" }),
    ];
    let id = 1;
    items.map(item => item.id = id++);

    jest.spyOn(service, "create").mockImplementation(async (createDto: CreateInventoryItemDto) => {
              const exists = items.find(unit => unit.name === createDto.name);
              if(exists){ return null; }
        
              const unit = factory.createDtoToEntity(createDto);
              unit.id = id++;
              items.push(unit);
              return unit;
            });
        
            jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
              return items.find(unit => unit.name === name) || null;
            });
            
            jest.spyOn(service, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryItemDto) => {
              const index = items.findIndex(unit => unit.id === id);
              if (index === -1) return null;
        
              const updated = factory.updateDtoToEntity(updateDto);
              updated.id = id++;
              items[index] = updated;
        
              return updated;
            });
        
            jest.spyOn(service, "findAll").mockResolvedValue(items);
        
            jest.spyOn(service, "findOne").mockImplementation(async (id: number) => {
              return items.find(unit => unit.id === id) || null;
            });
        
            jest.spyOn(service, "remove").mockImplementation( async (id: number) => {
              const index = items.findIndex(unit => unit.id === id);
              if (index === -1) return false;
        
              items.splice(index,1);
        
              return true;
            });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
