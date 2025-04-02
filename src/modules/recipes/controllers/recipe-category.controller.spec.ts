import { Test, TestingModule } from '@nestjs/testing';
import { RecipeCategoryController } from './recipe-category.controller';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { CreateRecipeCategoryDto } from '../dto/create-recipe-category.dto';
import { NotImplementedException } from '@nestjs/common';
import { UpdateRecipeCategoryDto } from '../dto/update-recipe-category.dto';

describe('recipe category controller', () => {
  let controller: RecipeCategoryController;
  let service: RecipeCategoryService;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    
    controller = module.get<RecipeCategoryController>(RecipeCategoryController);
    service = module.get<RecipeCategoryService>(RecipeCategoryService);

    jest.spyOn(service, "create").mockImplementation(async (dto: CreateRecipeCategoryDto) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "update").mockImplementation(async (id: number, dto: UpdateRecipeCategoryDto) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
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

  it('should create ', async () => {

  });

  it('should fail create ', async () => {

  });

  it('should find one', async () => {

  });

  it('should fail find one', async () => {

  });

  it('should find all', async () => {

  });

  it('should update', async () => {

  });

  it('should fail update', async () => {

  });

  it('should remove', async () => {

  });

  it('should fail remove', async () => {

  });
});
