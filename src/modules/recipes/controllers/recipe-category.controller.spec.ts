import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryController } from './recipe-category.controller';

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
            { categoryName: "CAT_A" } as RecipeCategory,
            { categoryName: "CAT_B" } as RecipeCategory,
            { categoryName: "CAT_C" } as RecipeCategory,
        ];
        id = 1;
        categories.map(category => category.id = id++);

        jest.spyOn(service, "create").mockImplementation(async (dto: CreateRecipeCategoryDto) => {
            const exists = categories.find(cat => cat.categoryName === dto.categoryName);
            if (exists) { throw new BadRequestException(); }

            const category = {
                id: id++,
                categoryName: dto.categoryName,
            } as RecipeCategory;

            categories.push(category);
            return category;
        });

        jest.spyOn(service, "update").mockImplementation(async (id: number, dto: UpdateRecipeCategoryDto) => {
            const existIdx = categories.findIndex(cat => cat.id === id);
            if (existIdx === -1) { throw new NotFoundException(); }

            if (dto.categoryName) {
                categories[existIdx].categoryName = dto.categoryName;
            }

            return categories[existIdx];
        });

        jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
            return categories.find(cat => cat.categoryName === name) || null;
        });

        jest.spyOn(service, "findAll").mockResolvedValue({ items: categories });

        jest.spyOn(service, "findOne").mockImplementation(async (id?: number) => {
            const result = categories.find(cat => cat.id === id);
            if (!result) {
                throw new NotFoundException();
            }
            return result;
        });

        jest.spyOn(service, "remove").mockImplementation(async (id: number) => {
            const index = categories.findIndex(cat => cat.id === id);
            if (index === -1) { return false; }

            categories.splice(index, 1);
            return true;
        });
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create a recipe category', async () => {
        const dto = {
            categoryName: "test category"
        } as CreateRecipeCategoryDto;
        const result = await controller.create(dto);
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.categoryName).toEqual("test category");

        testId = result?.id as number;
    });

    it('should fail create a recipe category', async () => {
        const dto = {
            categoryName: "test category"
        } as CreateRecipeCategoryDto;

        await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should find one recipe category', async () => {
        const result = await controller.findOne(1);
        expect(result).not.toBeNull();
    });

    it('should fail find one a recipe category', async () => {
        await expect(controller.findOne(0)).rejects.toThrow(NotFoundException);
    });

    it('should find all a recipe category', async () => {
        const results = await controller.findAll();
        expect(results).not.toBeNull();
        expect(results.items.length).toBeGreaterThan(0);
    });

    it('should update a recipe category', async () => {
        const dto = {
            categoryName: "updated test name"
        } as UpdateRecipeCategoryDto;

        const result = await controller.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.categoryName).toEqual("updated test name");
    });

    it('should fail update a recipe category', async () => {
        const dto = {
            categoryName: "updated test name"
        } as UpdateRecipeCategoryDto;

        await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
    });

    it('should remove a recipe category', async () => {
        const removal = await controller.remove(testId);
        expect(removal).toBeUndefined();
    });

    it('should fail remove a recipe category', async () => {
        await expect(controller.remove(testId)).rejects.toThrow(NotFoundException);
    });
});