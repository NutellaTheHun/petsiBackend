import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseTestContext } from '../../test/DatabaseTestContext';
import { InventoryAreaTestUtil } from '../inventory-areas/utils/inventory-area-test.util';
import { InventoryItemTestingUtil } from '../inventory-items/utils/inventory-item-testing.util';
import { LabelTestingUtil } from '../labels/utils/label-testing.util';
import { MenuItemTestingUtil } from '../menu-items/utils/menu-item-testing.util';
import { OrderTestingUtil } from '../orders/utils/order-testing.util';
import { RecipeTestUtil } from '../recipes/utils/recipe-test.util';
import { RoleService } from '../roles/services/role.service';
import { TemplateTestingUtil } from '../templates/utils/template-testing.util';
import { UnitOfMeasureTestingUtil } from '../unit-of-measure/utils/unit-of-measure-testing.util';
import { UserService } from '../users/services/user.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly configService: ConfigService,

    private readonly inventoryAreaTestUtil: InventoryAreaTestUtil,
    private readonly inventoryItemTestUtil: InventoryItemTestingUtil,
    private readonly labelTestUtil: LabelTestingUtil,
    private readonly menuItemTestUtil: MenuItemTestingUtil,
    private readonly orderTestUtil: OrderTestingUtil,
    private readonly recipeTestUtil: RecipeTestUtil,
    private readonly templateTestUtil: TemplateTestingUtil,
    private readonly unitOfMeasureTestUtil: UnitOfMeasureTestingUtil,
  ) {}

  private async seedRolesAndUsers() {
    // Seed Roles
    const roles = ['admin', 'manager', 'staff'];
    for (const role of roles) {
      const roleExists = await this.roleService.findOneByName(role);
      if (!roleExists) {
        await this.roleService.create({
          roleName: role,
        });
      }
    }

    // Seed Admin account
    const adminExists = await this.userService.findOneByName('admin');
    if (!adminExists) {
      const pwrd = this.configService.get<string>('seed_admin_pwrd') || 'error';
      if (!pwrd) {
        throw new Error();
      }

      const roles = await this.roleService.findAll();

      await this.userService.create({
        username: 'admin',
        password: pwrd,
        roleIds: roles.items.map((role) => role.id),
      });
    }

    //Seed Manager account
    const managerExist = await this.userService.findOneByName('manager');
    if (!managerExist) {
      const pwrd = 'manager';
      if (!pwrd) {
        throw new Error();
      }

      const role = await this.roleService.findOneByName('manager');
      if (!role) {
        throw new Error();
      }
      await this.userService.create({
        username: 'manager',
        password: pwrd,
        roleIds: [role.id],
      });
    }

    //Seed Staff account
    const staffExists = await this.userService.findOneByName('staff');
    if (!staffExists) {
      const pwrd = 'staff';
      if (!pwrd) {
        throw new Error();
      }

      const role = await this.roleService.findOneByName('staff');
      if (!role) {
        throw new Error();
      }

      await this.userService.create({
        username: 'staff',
        password: pwrd,
        roleIds: [role.id],
      });
    }

    // Seed Menu Item Sizes

    // Seed Units Of Measure (and categories)
  }

  async seedTestDb(inputCtx?: DatabaseTestContext) {
    let ctx = inputCtx ? inputCtx : new DatabaseTestContext();
    //const ctx: DatabaseTestContext = new DatabaseTestContext();

    await this.seedInventoryAreaModuleTestDb(ctx);
    await this.seedInventoryItemModuleTestDb(ctx);
    await this.seedLabelModuleTestDb(ctx);
    await this.seedMenuItemModuleTestDb(ctx);
    await this.seedOrdersModuleTestDb(ctx);
    await this.seedRecipeModuleTestDb(ctx);
    await this.seedTemplateModuleTestDb(ctx);
    await this.seedUnitOfMeasureModuleTestDb(ctx);
    await this.seedRoleModuleTestDb(ctx);
    await this.seedUserModuleTestDb(ctx);
  }

  // InventoryArea

  private async seedInventoryAreaModuleTestDb(ctx: DatabaseTestContext) {
    await this.seedInventoryAreaTestDb(ctx);
    await this.seedInventoryAreaCountTestDb(ctx);
    await this.seedInventoryAreaItemTestDb(ctx);
  }

  private async seedInventoryAreaTestDb(ctx: DatabaseTestContext) {
    await this.inventoryAreaTestUtil.initInventoryAreaTestDatabase(ctx);
  }

  private async seedInventoryAreaCountTestDb(ctx: DatabaseTestContext) {
    await this.inventoryAreaTestUtil.initInventoryAreaCountTestDatabase(ctx);
  }

  private async seedInventoryAreaItemTestDb(ctx: DatabaseTestContext) {
    await this.inventoryAreaTestUtil.initInventoryAreaItemCountTestDatabase(
      ctx,
    );
  }

  // Inventory item

  private async seedInventoryItemModuleTestDb(ctx: DatabaseTestContext) {
    await this.seedInventoryItemCategoryTestDb(ctx);
    await this.seedInventoryItemPackageTestDb(ctx);
    await this.seedInventoryItemVendorTestDb(ctx);
    await this.seedInventoryItemTestDb(ctx);
    await this.seedInventoryItemSizeTestDb(ctx);
  }

  private async seedInventoryItemCategoryTestDb(ctx: DatabaseTestContext) {
    await this.inventoryItemTestUtil.initInventoryItemCategoryTestDatabase(ctx);
  }

  private async seedInventoryItemPackageTestDb(ctx: DatabaseTestContext) {
    await this.inventoryItemTestUtil.initInventoryItemPackageTestDatabase(ctx);
  }

  private async seedInventoryItemSizeTestDb(ctx: DatabaseTestContext) {
    await this.inventoryItemTestUtil.initInventoryItemSizeTestDatabase(ctx);
  }

  private async seedInventoryItemVendorTestDb(ctx: DatabaseTestContext) {
    await this.inventoryItemTestUtil.initInventoryItemVendorTestDatabase(ctx);
  }

  private async seedInventoryItemTestDb(ctx: DatabaseTestContext) {
    await this.inventoryItemTestUtil.initInventoryItemTestDatabase(ctx);
  }

  // Label

  private async seedLabelModuleTestDb(ctx: DatabaseTestContext) {
    await this.seedLabelTypeTestDb(ctx);
    await this.seedLabelTestDb(ctx);
  }

  private async seedLabelTestDb(ctx: DatabaseTestContext) {
    await this.labelTestUtil.initLabelTestDatabase(ctx);
  }

  private async seedLabelTypeTestDb(ctx: DatabaseTestContext) {
    await this.labelTestUtil.initLabelTypeTestDatabase(ctx);
  }

  // MenuItem

  private async seedMenuItemModuleTestDb(ctx: DatabaseTestContext) {
    await this.seedMenuItemCategoryTestDb(ctx);
    await this.seedMenuItemSizeTestDb(ctx);
    await this.seedMenuItemTestDb(ctx);
    await this.seedMenuItemContainersTestDb(ctx);
  }

  private async seedMenuItemCategoryTestDb(ctx: DatabaseTestContext) {
    await this.menuItemTestUtil.initMenuItemCategoryTestDatabase(ctx);
  }

  //private async seedMenuItemContainerOptionsTestDb(ctx: DatabaseTestContext) {}
  //private async seedMenuItemContainerRulesTestDb(ctx: DatabaseTestContext) {}
  private async seedMenuItemContainersTestDb(ctx: DatabaseTestContext) {
    await this.menuItemTestUtil.initMenuItemContainerItemTestDatabase(ctx);
  }

  private async seedMenuItemSizeTestDb(ctx: DatabaseTestContext) {
    await this.menuItemTestUtil.initMenuItemSizeTestDatabase(ctx);
  }

  private async seedMenuItemTestDb(ctx: DatabaseTestContext) {
    await this.menuItemTestUtil.initMenuItemTestDatabase(ctx);
  }

  // Orders

  private async seedOrdersModuleTestDb(ctx: DatabaseTestContext) {
    await this.seedOrderCategoryTestDb(ctx);
    await this.seedOrderTestDb(ctx);
    await this.seedOrderMenuItemTestDb(ctx);
  }

  private async seedOrderCategoryTestDb(ctx: DatabaseTestContext) {
    await this.orderTestUtil.initOrderCategoryTestDatabase(ctx);
  }

  /*private async seedOrderContainerItemTestDb(ctx: DatabaseTestContext) {
    
  }*/

  private async seedOrderMenuItemTestDb(ctx: DatabaseTestContext) {
    await this.orderTestUtil.initOrderMenuItemTestDatabase(ctx);
  }

  private async seedOrderTestDb(ctx: DatabaseTestContext) {
    await this.orderTestUtil.initOrderTestDatabase(ctx);
  }

  // Recipe
  private async seedRecipeModuleTestDb(ctx: DatabaseTestContext) {
    await this.seedRecipeCategoryTestDb(ctx);
    await this.seedRecipeIngredientTestDb(ctx);
    await this.seedRecipeSubCategoryTestDb(ctx);
    await this.seedRecipeTestDb(ctx);
  }

  private async seedRecipeTestDb(ctx: DatabaseTestContext) {
    await this.recipeTestUtil.initRecipeTestingDatabase(ctx);
  }

  private async seedRecipeCategoryTestDb(ctx: DatabaseTestContext) {
    await this.recipeTestUtil.initRecipeCategoryTestingDatabase(ctx);
  }

  private async seedRecipeIngredientTestDb(ctx: DatabaseTestContext) {
    await this.recipeTestUtil.initRecipeIngredientTestingDatabase(ctx);
  }

  private async seedRecipeSubCategoryTestDb(ctx: DatabaseTestContext) {
    await this.recipeTestUtil.initRecipeSubCategoryTestingDatabase(ctx);
  }

  // Template

  private async seedTemplateModuleTestDb(ctx: DatabaseTestContext) {
    await this.seedTemplateTestDb(ctx);
    await this.seedTemplateMenuItemTestDb(ctx);
  }

  private async seedTemplateTestDb(ctx: DatabaseTestContext) {
    await this.templateTestUtil.initTemplateTestDatabase(ctx);
  }

  private async seedTemplateMenuItemTestDb(ctx: DatabaseTestContext) {
    await this.templateTestUtil.initTemplateMenuItemTestDatabase(ctx);
  }

  // unit of measure

  private async seedUnitOfMeasureModuleTestDb(ctx: DatabaseTestContext) {
    await this.seedUnitOfMeasureCategoryTestDb(ctx);
    await this.seedUnitOfMeasureTestDb(ctx);
  }

  private async seedUnitOfMeasureTestDb(ctx: DatabaseTestContext) {
    await this.unitOfMeasureTestUtil.initUnitOfMeasureTestDatabase(ctx);
  }

  private async seedUnitOfMeasureCategoryTestDb(ctx: DatabaseTestContext) {
    await this.unitOfMeasureTestUtil.initUnitCategoryTestDatabase(ctx);
  }

  // Role
  private async seedRoleModuleTestDb(ctx: DatabaseTestContext) {
    await this.seedRoleTestDb(ctx);
  }

  private async seedRoleTestDb(ctx: DatabaseTestContext) {
    const roles = ['admin', 'manager', 'staff'];
    for (const role of roles) {
      const roleExists = await this.roleService.findOneByName(role);
      if (!roleExists) {
        await this.roleService.create({
          roleName: role,
        });
      }
    }
  }

  // User
  /**
   * Calls seed Roles function before seeding users (is dependent on roles)
   */
  private async seedUserModuleTestDb(ctx: DatabaseTestContext) {
    await this.seedUserTestDb(ctx);
  }

  /**
   * Calls seed Roles function before seeding users (is dependent on roles)
   */
  private async seedUserTestDb(ctx: DatabaseTestContext) {
    await this.seedRoleTestDb(ctx);

    // Seed Admin account
    const adminExists = await this.userService.findOneByName('admin');
    if (!adminExists) {
      const pwrd = this.configService.get<string>('seed_admin_pwrd') || 'error';
      if (!pwrd) {
        throw new Error();
      }

      const roles = await this.roleService.findAll();

      await this.userService.create({
        username: 'admin',
        password: pwrd,
        roleIds: roles.items.map((role) => role.id),
      });
    }

    //Seed Manager account
    const managerExist = await this.userService.findOneByName('manager');
    if (!managerExist) {
      const pwrd = 'manager';
      if (!pwrd) {
        throw new Error();
      }

      const role = await this.roleService.findOneByName('manager');
      if (!role) {
        throw new Error();
      }
      await this.userService.create({
        username: 'manager',
        password: pwrd,
        roleIds: [role.id],
      });
    }

    //Seed Staff account
    const staffExists = await this.userService.findOneByName('staff');
    if (!staffExists) {
      const pwrd = 'staff';
      if (!pwrd) {
        throw new Error();
      }

      const role = await this.roleService.findOneByName('staff');
      if (!role) {
        throw new Error();
      }

      await this.userService.create({
        username: 'staff',
        password: pwrd,
        roleIds: [role.id],
      });
    }
  }
}
