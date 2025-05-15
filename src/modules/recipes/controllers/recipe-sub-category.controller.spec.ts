import { TestingModule } from '@nestjs/testing';
import { AppHttpException } from '../../../util/exceptions/AppHttpException';
import { CreateRecipeSubCategoryDto } from '../dto/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryController } from './recipe-sub-category.controller';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('recipe sub category controller', () => {
  let controller: RecipeSubCategoryController;
  let service: RecipeSubCategoryService;

  let testId: number;
  let subCategories: RecipeSubCategory[];
  let subCatId: number;

  let categories: RecipeCategory[];
  let catId: number;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    controller = module.get<RecipeSubCategoryController>(RecipeSubCategoryController);
    service = module.get<RecipeSubCategoryService>(RecipeSubCategoryService);

    categories = [
          { name: "CAT_A" } as RecipeCategory,
          { name: "CAT_B" } as RecipeCategory,
          { name: "CAT_C" } as RecipeCategory,
        ];
    catId = 1;
    categories.map(category => category.id = catId++);

    subCategories = [
      { name: "SUB_CAT_A", parentCategory: categories[0] } as RecipeSubCategory,
      { name: "SUB_CAT_B", parentCategory: categories[1] } as RecipeSubCategory,
      { name: "SUB_CAT_C", parentCategory: categories[2] } as RecipeSubCategory,
    ];
    subCatId = 1;
    subCategories.map(subCat => subCat.id = subCatId++);

    jest.spyOn(service, "create").mockImplementation(async (dto: CreateRecipeSubCategoryDto) => {
      const exists = subCategories.find(subCat => subCat.name === dto.name);
      if(exists){ throw new BadRequestException(); }

      const parentCategory = categories.find(cat => cat.id === dto.parentCategoryId);

      const subCat = {
        id: subCatId++,
        name: dto.name,
        parentCategory: parentCategory, 
      } as RecipeSubCategory;

      subCategories.push(subCat);
      return subCat;
    });

    jest.spyOn(service, "update").mockImplementation(async (id: number, dto: UpdateRecipeSubCategoryDto) => {
      const existIdx = subCategories.findIndex(subCat => subCat.id === id);
      if(existIdx === -1){ throw new NotFoundException(); }

      if(dto.name){
        subCategories[existIdx].name = dto.name;
      }
      if(dto.parentCategoryId){
        const parentCategory = categories.find(cat => cat.id === dto.parentCategoryId);
        if(!parentCategory){ throw new Error("parent category not found"); }
        subCategories[existIdx].parentCategory = parentCategory;
      }

      return subCategories[existIdx];
    });

    jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
      return subCategories.find(subCat => subCat.name === name) || null;
    });

    jest.spyOn(service, "findAll").mockResolvedValue({ items: subCategories });

    jest.spyOn(service, "findOne").mockImplementation(async (id?: number) => {
      if(!id){ throw new Error(); }
      const result = subCategories.find(subCat => subCat.id === id);
      if(!result){
        throw new NotFoundException();
      }
      return result;
    });

    jest.spyOn(service, "remove").mockImplementation(async (id: number) => {
      const index = subCategories.findIndex(subCat => subCat.id === id);
      if(index === -1){ return false; }

      subCategories.splice(index, 1);
      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a sub-category', async () => {
    const dto = {
      name: "testSubCat",
      parentCategoryId: categories[0].id
    } as CreateRecipeSubCategoryDto;

    const result = await controller.create(dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testSubCat");
    expect(result?.parentCategory.id).toEqual(categories[0].id);

    testId = result?.id as number;
  });

  it('should fail create a sub-category', async () => {
    const dto = {
      name: "testSubCat",
      parentCategoryId: categories[0].id
    } as CreateRecipeSubCategoryDto;

    await expect(controller.create(dto)).rejects.toThrow(BadRequestException)
  });

  it('should find one a sub-category', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });

  it('should fail find one a sub-category', async () => {
    await expect(controller.findOne(0)).rejects.toThrow(Error);
  });

  it('should find all a sub-category', async () => {
    const results = await controller.findAll();
    expect(results).not.toBeNull();
    expect(results.items.length).toBeGreaterThan(0);
  });

  it('should update a sub-category', async () => {
    const dto = {
      name: "UPDATEtestSubCat",
      parentCategoryId: categories[1].id
    } as UpdateRecipeSubCategoryDto;

    const result = await controller.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATEtestSubCat");
    expect(result?.parentCategory.id).toEqual(categories[1].id);
  });

  it('should fail update a sub-category', async () => {
    const dto = {
      name: "UPDATEtestSubCat",
      parentCategoryId: categories[1].id
    } as UpdateRecipeSubCategoryDto;

    await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
  });

  it('should remove a sub-category', async () => {
    const removal = await controller.remove(testId);
    expect(removal).toBeUndefined();
  });

  it('should fail remove a sub-category', async () => {
    await expect(controller.remove(testId)).rejects.toThrow(NotFoundException);
  });
});