import { TestingModule } from '@nestjs/testing';
import { AppHttpException } from '../../../util/exceptions/AppHttpException';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
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
          { categoryName: "CAT_A" } as RecipeCategory,
          { categoryName: "CAT_B" } as RecipeCategory,
          { categoryName: "CAT_C" } as RecipeCategory,
        ];
    catId = 1;
    categories.map(category => category.id = catId++);

    subCategories = [
      { subCategoryName: "SUB_CAT_A", parentCategory: categories[0] } as RecipeSubCategory,
      { subCategoryName: "SUB_CAT_B", parentCategory: categories[1] } as RecipeSubCategory,
      { subCategoryName: "SUB_CAT_C", parentCategory: categories[2] } as RecipeSubCategory,
    ];
    subCatId = 1;
    subCategories.map(subCat => subCat.id = subCatId++);

    jest.spyOn(service, "create").mockImplementation(async (dto: CreateRecipeSubCategoryDto) => {
      const exists = subCategories.find(subCat => subCat.subCategoryName === dto.subCategoryName);
      if(exists){ throw new BadRequestException(); }

      const parentCategory = categories.find(cat => cat.id === dto.parentCategoryId);

      const subCat = {
        id: subCatId++,
        subCategoryName: dto.subCategoryName,
        parentCategory: parentCategory, 
      } as RecipeSubCategory;

      subCategories.push(subCat);
      return subCat;
    });

    jest.spyOn(service, "update").mockImplementation(async (id: number, dto: UpdateRecipeSubCategoryDto) => {
      const existIdx = subCategories.findIndex(subCat => subCat.id === id);
      if(existIdx === -1){ throw new NotFoundException(); }

      if(dto.subCategoryName){
        subCategories[existIdx].subCategoryName = dto.subCategoryName;
      }
      if(dto.parentCategoryId){
        const parentCategory = categories.find(cat => cat.id === dto.parentCategoryId);
        if(!parentCategory){ throw new Error("parent category not found"); }
        subCategories[existIdx].parentCategory = parentCategory;
      }

      return subCategories[existIdx];
    });

    jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
      return subCategories.find(subCat => subCat.subCategoryName === name) || null;
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

  it('should fail to create a sub-category', async () => {
    const dto = {
      subCategoryName: "testSubCat",
      parentCategoryId: categories[0].id
    } as CreateRecipeSubCategoryDto;

    await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should fail create a sub-category', async () => {
    const dto = {
      subCategoryName: "testSubCat",
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
      subCategoryName: "UPDATEtestSubCat",
      parentCategoryId: categories[1].id
    } as UpdateRecipeSubCategoryDto;

    const result = await controller.update(1, dto);
    expect(result).not.toBeNull();
    expect(result?.subCategoryName).toEqual("UPDATEtestSubCat");
    expect(result?.parentCategory.id).toEqual(categories[1].id);
  });

  it('should fail update a sub-category', async () => {
    const dto = {
      subCategoryName: "UPDATEtestSubCat",
      parentCategoryId: categories[1].id
    } as UpdateRecipeSubCategoryDto;

    await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
  });

  it('should remove a sub-category', async () => {
    const removal = await controller.remove(1);
    expect(removal).toBeUndefined();
  });

  it('should fail remove a sub-category', async () => {
    await expect(controller.remove(1)).rejects.toThrow(NotFoundException);
  });
});