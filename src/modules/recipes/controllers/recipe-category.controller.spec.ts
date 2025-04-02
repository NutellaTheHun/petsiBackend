import { TestingModule } from '@nestjs/testing';
import { CreateRecipeCategoryDto } from '../dto/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/update-recipe-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryController } from './recipe-category.controller';

describe('recipe category controller', () => {
  let controller: RecipeCategoryController;
  let service: RecipeCategoryService;
  let categories: RecipeCategory[];
  let id: number;

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
      const existIdx = categories.findIndex(cat => cat.name === dto.name);
      if(!existIdx){ return null; }

      if(dto.name){
        categories[existIdx].name = dto.name;
      }

      return categories[existIdx];
    });

    jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
      return categories.find(cat => cat.name === name) || null;
    });

    jest.spyOn(service, "findAll").mockResolvedValue(categories);

    jest.spyOn(service, "findOne").mockImplementation(async (id: number) => {
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

  });

  it('should fail create a recipe category', async () => {

  });

  it('should find one a recipe category', async () => {

  });

  it('should fail find one a recipe category', async () => {

  });

  it('should find all a recipe category', async () => {

  });

  it('should update a recipe category', async () => {

  });

  it('should fail update a recipe category', async () => {

  });

  it('should remove a recipe category', async () => {

  });

  it('should fail remove a recipe category', async () => {

  });
});
