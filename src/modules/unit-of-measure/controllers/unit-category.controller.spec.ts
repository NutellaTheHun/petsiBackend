import { TestingModule } from '@nestjs/testing';
import { UnitCategoryController } from './unit-category.controller';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitCategory } from '../entities/unit-category.entity';
import { UnitCategoryService } from '../services/unit-category.service';
import { CreateUnitCategoryDto } from '../dto/create-unit-category.dto';
import { UpdateUnitCategoryDto } from '../dto/update-unit-category.dto';
import { UNIT, VOLUME, WEIGHT } from '../utils/constants';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppHttpException } from '../../../util/exceptions/AppHttpException';

describe('UnitCategoryController', () => {
  let controller: UnitCategoryController;
  let categoryService: UnitCategoryService;
  let categories: UnitCategory[];

  beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule();
    controller = module.get<UnitCategoryController>(UnitCategoryController);
    categoryService = module.get<UnitCategoryService>(UnitCategoryService);

    categories = [
      { name: UNIT } as UnitCategory,
      { name: VOLUME } as UnitCategory,
      { name: WEIGHT } as UnitCategory,
    ];
    let id = 1;
    categories.map(category => category.id = id++);

    jest.spyOn(categoryService, "create").mockImplementation(async (createDto: CreateUnitCategoryDto) => {
      const exists = categories.find(unit => unit.name === createDto.name);
      if(exists){ throw new BadRequestException(); }

      const unit = {
        id: id++,
        name: createDto.name,
      } as UnitCategory;

      categories.push(unit);
      return unit;
    });

    jest.spyOn(categoryService, "findOneByName").mockImplementation(async (name: string) => {
      return categories.find(unit => unit.name === name) || null;
    });
    
    jest.spyOn(categoryService, "update").mockImplementation( async (id: number, updateDto: UpdateUnitCategoryDto) => {
      const index = categories.findIndex(unit => unit.id === id);
      if(index === -1){ throw new NotFoundException(); }
      
      if(updateDto.name){
        categories[index].name = updateDto.name;
      }

      return categories[index];
    });

    jest.spyOn(categoryService, "findAll").mockResolvedValue({ items: categories });

    jest.spyOn(categoryService, "findOne").mockImplementation(async (id?: number) => {
      if(!id){ throw new BadRequestException(); }
      const result = categories.find(unit => unit.id === id);
      if(!result){
        throw new NotFoundException();
      }
      return result;
    });

    jest.spyOn(categoryService, "remove").mockImplementation( async (id: number) => {
      const index = categories.findIndex(unit => unit.id === id);
      if (index === -1){ throw new NotFoundException(); } 

      categories.splice(index,1);

      return true;
    });
    
  });

 
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a category', async () => {
    const dto = {
      name: "testCategory",
    } as CreateUnitCategoryDto;

    const result = await controller.create(dto);
    expect(result).not.toBeNull();
  });
  
  it('should fail to create a category (already exists)', async () => {
    const dto = {
      name: "testCategory",
    } as CreateUnitCategoryDto;

    await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should return all categories', async () => {
    const results = await controller.findAll();
    expect(results.items.length).toEqual(categories.length);
  });
  
  it('should return a category by id', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });
  
  it('should fail to return a category (bad id, returns null)', async () => {
    await expect(controller.findOne(0)).rejects.toThrow(BadRequestException);
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
    
    await expect(controller.update(0, toUpdate)).rejects.toThrow(NotFoundException);
  });
  
  it('should remove a category', async () => {
    const toRemove = await categoryService.findOneByName("UPDATED_testCategory");
    if(!toRemove){ throw new Error("unit to remove not found"); }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeUndefined();
  });

  it('should fail to remove a category (id not found, returns false)', async () => {
    await expect(controller.remove(0)).rejects.toThrow(NotFoundException);
  });
});
