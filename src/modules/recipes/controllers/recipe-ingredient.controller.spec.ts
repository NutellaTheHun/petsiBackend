import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { InventoryItemCategory } from '../../inventory-items/entities/inventory-item-category.entity';
import { InventoryItemVendor } from '../../inventory-items/entities/inventory-item-vendor.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientController } from './recipe-ingredient.controller';

const P = `t${Date.now()}`;

describe('recipe ingredient controller', () => {
    let testingUtil: RecipeTestUtil;
    let testCtx: DatabaseTestContext;
    let controller: RecipeIngredientController;
    let recipeRepo: Repository<Recipe>;
    let categoryRepo: Repository<RecipeCategory>;
    let subCategoryRepo: Repository<RecipeSubCategory>;
    let ingredientRepo: Repository<RecipeIngredient>;
    let invCategoryRepo: Repository<InventoryItemCategory>;
    let invVendorRepo: Repository<InventoryItemVendor>;
    let invItemRepo: Repository<InventoryItem>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let categories: RecipeCategory[];
    let subCategories: RecipeSubCategory[];
    let recipes: Recipe[];
    let invCategories: InventoryItemCategory[];
    let invVendors: InventoryItemVendor[];
    let invItems: InventoryItem[];
    let ingredients: RecipeIngredient[];

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule();
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        controller = module.get<RecipeIngredientController>(
            RecipeIngredientController,
        );
        recipeRepo = module.get(getRepositoryToken(Recipe));
        categoryRepo = module.get(getRepositoryToken(RecipeCategory));
        subCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));
        ingredientRepo = module.get(getRepositoryToken(RecipeIngredient));
        invCategoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        invVendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
        invItemRepo = module.get(getRepositoryToken(InventoryItem));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        requestContext.setContext({ tenantId: tenant.id });

        ({ categories, subCategories, recipes, invCategories, invVendors, invItems, ingredients } =
            await testingUtil.seedIngredients(P, tenant.id));
    });

    afterAll(async () => {
        await ingredientRepo.delete(ingredients.map((i) => i.id));
        await recipeRepo.delete(recipes.map((r) => r.id));
        await subCategoryRepo.delete(subCategories.map((s) => s.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await invItemRepo.delete(invItems.map((i) => i.id));
        await invVendorRepo.delete(invVendors.map((v) => v.id));
        await invCategoryRepo.delete(invCategories.map((c) => c.id));
        await tenantRepo.delete(tenant.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('remove deletes an ingredient then findOne fails', async () => {
        const toRemove = await ingredientRepo.save(
            ingredientRepo.create({
                parentRecipe: recipes[3],
                ingredientInventoryItem: invItems[5],
                quantity: 1,
                unit: 'oz',
                tenantId: tenant.id,
            }),
        );
        await controller.remove(toRemove.id);
        await expect(controller.findOne(toRemove.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
