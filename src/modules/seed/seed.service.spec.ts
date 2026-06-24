import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../test/DatabaseTestContext';
import { InventoryAreaCountService } from '../inventory-areas/services/inventory-area-count.service';
import { InventoryAreaItemService } from '../inventory-areas/services/inventory-area-item.service';
import { InventoryAreaService } from '../inventory-areas/services/inventory-area.service';
import { InventoryItemCategoryService } from '../inventory-items/services/inventory-item-category.service';
import { InventoryItemPackageService } from '../inventory-items/services/inventory-item-package.service';
import { InventoryItemSizeService } from '../inventory-items/services/inventory-item-size.service';
import { InventoryItemVendorService } from '../inventory-items/services/inventory-item-vendor.service';
import { InventoryItemService } from '../inventory-items/services/inventory-item.service';
import { LabelTypeService } from '../labels/services/label-type.service';
import { LabelService } from '../labels/services/label.service';
import { MenuItemCategoryService } from '../menu-items/services/menu-item-category.service';
import { MenuItemContainerItemService } from '../menu-items/services/menu-item-container-item.service';
import { MenuItemSizeService } from '../menu-items/services/menu-item-size.service';
import { MenuItemService } from '../menu-items/services/menu-item.service';
import { OrderCategoryService } from '../orders/services/order-category.service';
import { OrderContainerItemService } from '../orders/services/order-container-item.service';
import { OrderMenuItemService } from '../orders/services/order-menu-item.service';
import { OrderService } from '../orders/services/order.service';
import { RecipeCategoryService } from '../recipes/services/recipe-category.service';
import { RecipeIngredientService } from '../recipes/services/recipe-ingredient.service';
import { RecipeSubCategoryService } from '../recipes/services/recipe-sub-category.service';
import { RecipeService } from '../recipes/services/recipe.service';
import { RoleService } from '../roles/services/role.service';
import { TemplateMenuItemService } from '../templates/services/template-menu-item.service';
import { TemplateService } from '../templates/services/template.service';
import { UserService } from '../users/services/user.service';
import { getSeedTestingModule } from './seed-testing.module';
import { SeedService } from './seed.service';

describe('Seed Service', () => {
  let seedService: SeedService;
  let textContext: DatabaseTestContext;

  let inventoryAreaCountService: InventoryAreaCountService;
  let inventoryAreaItemService: InventoryAreaItemService;
  let inventoryAreaService: InventoryAreaService;

  let inventoryItemService: InventoryItemService;
  let inventoryItemCategoryService: InventoryItemCategoryService;
  let inventoryItemPackageService: InventoryItemPackageService;
  let inventoryItemVendorService: InventoryItemVendorService;
  let inventoryItemSizeService: InventoryItemSizeService;

  let labelService: LabelService;
  let labelTypeService: LabelTypeService;

  let menuItemService: MenuItemService;
  let menuItemCategoryService: MenuItemCategoryService;
  let menuItemContainerItemService: MenuItemContainerItemService;
  let menuItemSizeService: MenuItemSizeService;

  let orderService: OrderService;
  let orderCategoryService: OrderCategoryService;
  let orderContainerItemService: OrderContainerItemService;
  let orderMenuItemService: OrderMenuItemService;

  let recipeService: RecipeService;
  let recipeCategoryService: RecipeCategoryService;
  let recipeIngredientService: RecipeIngredientService;
  let recipeSubCategoryService: RecipeSubCategoryService;

  let roleService: RoleService;

  let templateService: TemplateService;
  let templateMenuItemService: TemplateMenuItemService;

  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await getSeedTestingModule();
    seedService = module.get<SeedService>(SeedService);
    textContext = new DatabaseTestContext();

    // Inventory Area
    inventoryAreaCountService = module.get<InventoryAreaCountService>(
      InventoryAreaCountService,
    );
    inventoryAreaItemService = module.get<InventoryAreaItemService>(
      InventoryAreaItemService,
    );
    inventoryAreaService =
      module.get<InventoryAreaService>(InventoryAreaService);

    // Inventory Item
    inventoryItemService =
      module.get<InventoryItemService>(InventoryItemService);
    inventoryItemCategoryService = module.get<InventoryItemCategoryService>(
      InventoryItemCategoryService,
    );
    inventoryItemPackageService = module.get<InventoryItemPackageService>(
      InventoryItemPackageService,
    );
    inventoryItemVendorService = module.get<InventoryItemVendorService>(
      InventoryItemVendorService,
    );
    inventoryItemSizeService = module.get<InventoryItemSizeService>(
      InventoryItemSizeService,
    );

    // Label
    labelService = module.get<LabelService>(LabelService);
    labelTypeService = module.get<LabelTypeService>(LabelTypeService);

    // Menu Item
    menuItemService = module.get<MenuItemService>(MenuItemService);
    menuItemCategoryService = module.get<MenuItemCategoryService>(
      MenuItemCategoryService,
    );
    menuItemContainerItemService = module.get<MenuItemContainerItemService>(
      MenuItemContainerItemService,
    );
    menuItemSizeService = module.get<MenuItemSizeService>(MenuItemSizeService);

    // Order
    orderService = module.get<OrderService>(OrderService);
    orderCategoryService =
      module.get<OrderCategoryService>(OrderCategoryService);
    orderContainerItemService = module.get<OrderContainerItemService>(
      OrderContainerItemService,
    );
    orderMenuItemService =
      module.get<OrderMenuItemService>(OrderMenuItemService);

    // Recipe
    recipeService = module.get<RecipeService>(RecipeService);
    recipeCategoryService = module.get<RecipeCategoryService>(
      RecipeCategoryService,
    );
    recipeIngredientService = module.get<RecipeIngredientService>(
      RecipeIngredientService,
    );
    recipeSubCategoryService = module.get<RecipeSubCategoryService>(
      RecipeSubCategoryService,
    );

    // Role
    roleService = module.get<RoleService>(RoleService);

    // Template
    templateService = module.get<TemplateService>(TemplateService);
    templateMenuItemService = module.get<TemplateMenuItemService>(
      TemplateMenuItemService,
    );

    // user
    userService = module.get<UserService>(UserService);
  });

  afterAll(async () => {
    textContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(seedService).toBeDefined();
  });

  /*it('should seed the database', async () => {
    await seedService.seedRolesAndUsers();

    const roles = await roleService.findAll();
    expect(roles.items.length).toEqual(3);

    const users = await userServce.findAll();
    expect(users.items.length).toEqual(1);
  });*/

  it('should seed the entire database', async () => {
    await seedService.seedTestDb(textContext);

    // inventory areas
    const invAreaCounts = await inventoryAreaCountService.findAll();
    expect(invAreaCounts.items.length).toBeGreaterThan(0);

    const invAreaItemCounts = await inventoryAreaItemService.findAll();
    expect(invAreaItemCounts.items.length).toBeGreaterThan(0);

    const invAreas = await inventoryAreaService.findAll();
    expect(invAreas.items.length).toBeGreaterThan(0);

    // inventory items
    const invItems = await inventoryItemService.findAll();
    expect(invItems.items.length).toBeGreaterThan(0);

    const invCategories = await inventoryItemCategoryService.findAll();
    expect(invCategories.items.length).toBeGreaterThan(0);

    const invPackages = await inventoryItemPackageService.findAll();
    expect(invPackages.items.length).toBeGreaterThan(0);

    const invVendors = await inventoryItemVendorService.findAll();
    expect(invVendors.items.length).toBeGreaterThan(0);

    const invSizes = await inventoryItemSizeService.findAll();
    expect(invSizes.items.length).toBeGreaterThan(0);

    // labels
    const labels = await labelService.findAll();
    expect(labels.items.length).toBeGreaterThan(0);

    const labelTypes = await labelTypeService.findAll();
    expect(labelTypes.items.length).toBeGreaterThan(0);

    // Menu Items
    const menuItems = await menuItemService.findAll();
    expect(menuItems.items.length).toBeGreaterThan(0);

    const menuCategories = await menuItemCategoryService.findAll();
    expect(menuCategories.items.length).toBeGreaterThan(0);

    const menuContainerItems = await menuItemContainerItemService.findAll();
    expect(menuContainerItems.items.length).toBeGreaterThan(0);

    // container options/rules are not currently seeded (legacy feature removed)

    const menuSizes = await menuItemSizeService.findAll();
    expect(menuSizes.items.length).toBeGreaterThan(0);

    // Orders
    const orders = await orderService.findAll();
    expect(orders.items.length).toBeGreaterThan(0);

    const orderCategories = await orderCategoryService.findAll();
    expect(orderCategories.items.length).toBeGreaterThan(0);

    const orderContainerItems = await orderContainerItemService.findAll();
    expect(orderContainerItems.items.length).toBeGreaterThan(0);

    const orderMenuItems = await orderMenuItemService.findAll();
    expect(orderMenuItems.items.length).toBeGreaterThan(0);

    // Recipes
    const recipes = await recipeService.findAll();
    expect(recipes.items.length).toBeGreaterThan(0);

    const recipeCategories = await recipeCategoryService.findAll();
    expect(recipeCategories.items.length).toBeGreaterThan(0);

    const recipeIngredients = await recipeIngredientService.findAll();
    expect(recipeIngredients.items.length).toBeGreaterThan(0);

    const recipeSubCategories = await recipeSubCategoryService.findAll();
    expect(recipeSubCategories.items.length).toBeGreaterThan(0);

    // Templates
    const templates = await templateService.findAll();
    expect(templates.items.length).toBeGreaterThan(0);

    const templateItems = await templateMenuItemService.findAll();
    expect(templateItems.items.length).toBeGreaterThan(0);

    // Roles
    const roles = await roleService.findAll();
    expect(roles.items.length).toBeGreaterThan(0);

    // Users
    const users = await userService.findAll();
    expect(users.items.length).toBeGreaterThan(0);
  });
});
