import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemCategoryService } from '../services/inventory-item-category.service';
import {
  CLEANING_CAT,
  DAIRY_CAT,
  DRYGOOD_CAT,
  FOOD_CAT,
  FROZEN_CAT,
  OTHER_CAT,
  PAPER_CAT,
  PRODUCE_CAT,
} from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemCategoryController } from './inventory-item-category.controller';

describe('Inventory Item Categories Controller', () => {
  let controller: InventoryItemCategoryController;
  let categoryService: InventoryItemCategoryService;

  let categories: InventoryItemCategory[];
  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemCategoryController>(
      InventoryItemCategoryController,
    );
    categoryService = module.get<InventoryItemCategoryService>(
      InventoryItemCategoryService,
    );

    categories = [
      { categoryName: CLEANING_CAT } as InventoryItemCategory,
      { categoryName: DAIRY_CAT } as InventoryItemCategory,
      { categoryName: DRYGOOD_CAT } as InventoryItemCategory,
      { categoryName: FOOD_CAT } as InventoryItemCategory,
      { categoryName: FROZEN_CAT } as InventoryItemCategory,
      { categoryName: OTHER_CAT } as InventoryItemCategory,
      { categoryName: PAPER_CAT } as InventoryItemCategory,
      { categoryName: PRODUCE_CAT } as InventoryItemCategory,
    ];
    let id = 1;
    categories.map((category) => (category.id = id++));

    jest
      .spyOn(categoryService, 'create')
      .mockImplementation(async (createDto: CreateInventoryItemCategoryDto) => {
        const exists = categories.find(
          (unit) => unit.categoryName === createDto.itemCategoryName,
        );
        if (exists) {
          throw new BadRequestException();
        }

        const unit = {
          id: id++,
          categoryName: createDto.itemCategoryName,
        } as InventoryItemCategory;

        categories.push(unit);
        return unit;
      });

    jest
      .spyOn(categoryService, 'findOneByName')
      .mockImplementation(async (name: string) => {
        return categories.find((unit) => unit.categoryName === name) || null;
      });

    jest
      .spyOn(categoryService, 'update')
      .mockImplementation(
        async (id: number, updateDto: UpdateInventoryItemCategoryDto) => {
          const index = categories.findIndex((unit) => unit.id === id);
          if (index === -1) throw new NotFoundException();

          if (updateDto.itemCategoryName) {
            categories[index].categoryName = updateDto.itemCategoryName;
          }

          return categories[index];
        },
      );

    jest
      .spyOn(categoryService, 'findAll')
      .mockResolvedValue({ items: categories });

    jest
      .spyOn(categoryService, 'findOne')
      .mockImplementation(async (id?: number) => {
        const result = categories.find((unit) => unit.id === id);
        if (!result) {
          throw new NotFoundException();
        }
        return result;
      });

    jest
      .spyOn(categoryService, 'remove')
      .mockImplementation(async (id: number) => {
        const index = categories.findIndex((unit) => unit.id === id);
        if (index === -1) return false;

        categories.splice(index, 1);

        return true;
      });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a category', async () => {
    const dto = {
      itemCategoryName: 'testCategory',
    } as CreateInventoryItemCategoryDto;

    const result = await controller.create(dto);
    expect(result).not.toBeNull();
  });

  it('should fail to create a category (already exists)', async () => {
    const dto = {
      itemCategoryName: 'testCategory',
    } as CreateInventoryItemCategoryDto;

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
    await expect(controller.findOne(0)).rejects.toThrow(NotFoundException);
  });

  it('should update a category', async () => {
    const toUpdate = await categoryService.findOneByName('testCategory');
    if (!toUpdate) {
      throw new Error('unit to update not found');
    }

    const dto = {
      itemCategoryName: 'UPDATED_testCategory',
    } as UpdateInventoryItemCategoryDto;

    const result = await controller.update(toUpdate.id, dto);
    expect(result).not.toBeNull();
    expect(result?.categoryName).toEqual('UPDATED_testCategory');
  });

  it('should fail to update a category (doesnt exist)', async () => {
    //const toUpdate = await categoryService.findOneByName("UPDATED_testCategory");
    //if(!toUpdate){ throw new Error("unit to update not found"); }
    const dto = {} as UpdateInventoryItemCategoryDto;
    await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
  });

  it('should remove a category', async () => {
    const toRemove = await categoryService.findOneByName(
      'UPDATED_testCategory',
    );
    if (!toRemove) {
      throw new Error('unit to remove not found');
    }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeUndefined();
  });

  it('should fail to remove a category (id not found)', async () => {
    await expect(controller.remove(0)).rejects.toThrow(NotFoundException);
  });
});
