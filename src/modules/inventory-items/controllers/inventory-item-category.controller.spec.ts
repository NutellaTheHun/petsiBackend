import { TestingModule } from "@nestjs/testing";
import { InventoryItemCategoryController } from "./inventory-item-category.controller";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { InventoryItemCategoryFactory } from "../factories/inventory-item-category.factory";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { CreateInventoryItemCategoryDto } from "../dto/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/update-inventory-item-category.dto";

describe('Inventory Item Categories Controller', () => {
  let controller: InventoryItemCategoryController;
  let categoryService: InventoryItemCategoryService;
  let categoryFactory: InventoryItemCategoryFactory;

  let categories: InventoryItemCategory[];
  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemCategoryController>(InventoryItemCategoryController);
    categoryService = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
    categoryFactory = module.get<InventoryItemCategoryFactory>(InventoryItemCategoryFactory);

    categories = await categoryFactory.getTestingItemCategories();
    let id = 1;
    categories.map(category => category.id = id++);

    jest.spyOn(categoryService, "create").mockImplementation(async (createDto: CreateInventoryItemCategoryDto) => {
      const exists = categories.find(unit => unit.name === createDto.name);
      if(exists){ return null; }

      const unit = categoryFactory.createDtoToEntity(createDto);
      unit.id = id++;
      categories.push(unit);
      return unit;
    });
        
    jest.spyOn(categoryService, "findOneByName").mockImplementation(async (name: string) => {
      return categories.find(unit => unit.name === name) || null;
    });
    
    jest.spyOn(categoryService, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryItemCategoryDto) => {
      const index = categories.findIndex(unit => unit.id === id);
      if (index === -1) return null;

      const updated = categoryFactory.updateDtoToEntity(updateDto);
      updated.id = id++;
      categories[index] = updated;

      return updated;
    });

    jest.spyOn(categoryService, "findAll").mockResolvedValue(categories);

    jest.spyOn(categoryService, "findOne").mockImplementation(async (id: number) => {
      return categories.find(unit => unit.id === id) || null;
    });

    jest.spyOn(categoryService, "remove").mockImplementation( async (id: number) => {
      const index = categories.findIndex(unit => unit.id === id);
      if (index === -1) return false;

      categories.splice(index,1);

      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  
  it('should create a category', async () => {
    const unitDto = categoryFactory.createDtoInstance({
      name: "testCategory",
    })
    const result = await controller.create(unitDto);
    expect(result).not.toBeNull();
  });
  
  it('should fail to create a category (already exists)', async () => {
    const unitDto = categoryFactory.createDtoInstance({
      name: "testCategory",
    })
    const result = await controller.create(unitDto);
    expect(result).toBeNull();
  });

  it('should return all categories', async () => {
    const results = await controller.findAll();
    expect(results.length).toEqual(categories.length);
  });
  
  it('should return a category by id', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });
  
  it('should fail to return a category (bad id, returns null)', async () => {
    const result = await controller.findOne(0);
    expect(result).toBeNull();
  });
  
  it('should update a category', async () => {
    const toUpdate = await categoryService.findOneByName("testCategory");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    toUpdate.name = "UPDATED_testCategory";
    const result = await controller.update(toUpdate.id, toUpdate);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATED_testCategory")
  });
  
  it('should fail to update a category (doesnt exist)', async () => {
    const toUpdate = await categoryService.findOneByName("UPDATED_testCategory");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    const result = await controller.update(0, toUpdate);
    expect(result).toBeNull();
  });
  
  it('should remove a category', async () => {
    const toRemove = await categoryService.findOneByName("UPDATED_testCategory");
    if(!toRemove){ throw new Error("unit to remove not found"); }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeTruthy();
  });

  it('should fail to remove a category (id not found, returns false)', async () => {
    const result = await controller.remove(0);
    expect(result).toBeFalsy();
  });
});