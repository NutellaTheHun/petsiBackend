import { TestingModule } from '@nestjs/testing';
import { RecipeSubCategoryController } from './recipe-sub-category.controller';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';
import { NotImplementedException } from '@nestjs/common';
import { CreateRecipeSubCategoryDto } from '../dto/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/update-recipe-sub-category.dto';

describe('recipe sub category controller', () => {
  let controller: RecipeSubCategoryController;
  let service: RecipeSubCategoryService;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    controller = module.get<RecipeSubCategoryController>(RecipeSubCategoryController);
    service = module.get<RecipeSubCategoryService>(RecipeSubCategoryService);

    jest.spyOn(service, "create").mockImplementation(async (dto: CreateRecipeSubCategoryDto) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "update").mockImplementation(async (id: number, dto: UpdateRecipeSubCategoryDto) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "findByCategoryName").mockImplementation(async (name: string) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "findOneByCategoryNameAndSubCategoryName").mockImplementation(async (catName: string, subName: string) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "findAll").mockImplementation();

    jest.spyOn(service, "findOne").mockImplementation(async (id: number) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "remove").mockImplementation(async (id: number) => {
      throw new NotImplementedException();
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
