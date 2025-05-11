import { TestingModule } from '@nestjs/testing';
import { CreateRecipeCategoryDto } from '../dto/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/update-recipe-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryController } from './recipe-category.controller';
import { BadRequestException } from '@nestjs/common';

describe('recipe category controller', () => {
  let controller: RecipeCategoryController;
  let service: RecipeCategoryService;
  let categories: RecipeCategory[];
  let id: number;
  let testId: number; 

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    
    controller = module.get<RecipeCategoryController>(RecipeCategoryController);
    service = module.get<RecipeCategoryService>(RecipeCategoryService);
    
    categories = [
      { name: "CAT_A" } as RecipeCategory,
      { name: "CAT_B" } as RecipeCategory,
      { name: "CAT_C" } as RecipeCategory,
    ];
    id = 1;
    categories.map(category => category.id = id++);

    jest.spyOn(service, "create").mockImplementation(async (dto: CreateRecipeCategoryDto) => {
      const exists = categories.find(cat => cat.name === dto.name);
      if(exists){ return null; }

      const category = {
        id: id++,
        name: dto.name,
      } as RecipeCategory;

      categories.push(category);
      return category;
    });

    jest.spyOn(service, "update").mockImplementation(async (id: number, dto: UpdateRecipeCategoryDto) => {
      const existIdx = categories.findIndex(cat => cat.id === id);
      if(existIdx === -1){ return null; }

      if(dto.name){
        categories[existIdx].name = dto.name;
      }

      return categories[existIdx];
    });

    jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
      return categories.find(cat => cat.name === name) || null;
    });

    jest.spyOn(service, "findAll").mockResolvedValue({ items: categories });

    jest.spyOn(service, "findOne").mockImplementation(async (id?: number) => {
      if(!id){ throw new BadRequestException(); }
      return categories.find(cat => cat.id === id) || null;
    });

    jest.spyOn(service, "remove").mockImplementation(async (id: number) => {
      const index = categories.findIndex(cat => cat.id === id);
      if(index === -1){ return false; }

      categories.splice(index, 1);
      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a recipe category', async () => {
    const dto = {
      name: "test category"
    } as CreateRecipeCategoryDto;
    const result = await controller.create(dto);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull()
    expect(result?.name).toEqual("test category");

    testId = result?.id as number;
  });

  it('should fail create a recipe category', async () => {
    const dto = {
      name: "test category"
    } as CreateRecipeCategoryDto;
    const result = await controller.create(dto);
    expect(result).toBeNull();
  });

  it('should find one recipe category', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });

  it('should fail find one a recipe category', async () => {
    //const result = await controller.findOne(0);
    //expect(result).toBeNull();
    await expect(controller.findOne(0)).rejects.toThrow(BadRequestException);
  });

  it('should find all a recipe category', async () => {
    const results = await controller.findAll();
    expect(results).not.toBeNull();
    expect(results.items.length).toBeGreaterThan(0);
  });

  it('should update a recipe category', async () => {
    const dto = {
      name: "updated test name"
    } as UpdateRecipeCategoryDto;

    const result = await controller.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("updated test name");
  });

  it('should fail update a recipe category', async () => {
    const dto = {
      name: "updated test name"
    } as UpdateRecipeCategoryDto;

    const result = await controller.update(0, dto);
    expect(result).toBeNull();
  });

  it('should remove a recipe category', async () => {
    const removal = await controller.remove(testId);
    expect(removal).toBeTruthy();
  });

  it('should fail remove a recipe category', async () => {
    const removal = await controller.remove(testId);
    expect(removal).toBeFalsy();
  });
});