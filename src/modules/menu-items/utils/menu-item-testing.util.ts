import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { MenuItemCategoryBuilder } from '../builders/menu-item-category.builder';
import { MenuItemSizeBuilder } from '../builders/menu-item-size.builder';
import { MenuItemBuilder } from '../builders/menu-item.builder';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { CreateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/create-menu-item-container-options.dto';
import { CreateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemCategoryService } from '../services/menu-item-category.service';
import { MenuItemContainerItemService } from '../services/menu-item-container-item.service';
import { MenuItemContainerOptionsService } from '../services/menu-item-container-options.service';
import { MenuItemContainerRuleService } from '../services/menu-item-container-rule.service';
import { MenuItemSizeService } from '../services/menu-item-size.service';
import { MenuItemService } from '../services/menu-item.service';
import {
  getItemContainerTestNames,
  getTestCategoryNames,
  getTestItemNames,
  getTestSizeNames,
  item_a,
  item_b,
  item_c,
  item_d,
  item_f,
  item_g,
  SIZE_ONE,
} from './constants';

@Injectable()
export class MenuItemTestingUtil {
  private menuItemSizeInit = false;
  private menuItemCategoryInit = false;
  private menuItemInit = false;
  private menuItemContainerOptionsInit = false;
  private menuItemComponentInit = false;

  constructor(
    private readonly itemService: MenuItemService,
    private readonly sizeService: MenuItemSizeService,
    private readonly categoryService: MenuItemCategoryService,
    private readonly componentService: MenuItemContainerItemService,
    private readonly itemcomponentOptionsService: MenuItemContainerOptionsService,
    private readonly componentOptionService: MenuItemContainerRuleService,

    private readonly itemBuilder: MenuItemBuilder,
    private readonly sizeBuilder: MenuItemSizeBuilder,
    private readonly categoryBuilder: MenuItemCategoryBuilder,
  ) {}

  // Menu Item Size
  public async getTestMenuItemSizeEntities(
    testContext: DatabaseTestContext,
  ): Promise<MenuItemSize[]> {
    const sizeNames = getTestSizeNames();
    const results: MenuItemSize[] = [];

    for (const name of sizeNames) {
      const exists = await this.sizeService.findOneByName(name);
      if (exists) {
        continue;
      }

      results.push(await this.sizeBuilder.reset().name(name).build());
    }
    return results;
  }

  public async initMenuItemSizeTestDatabase(
    testContext: DatabaseTestContext,
  ): Promise<void> {
    if (this.menuItemSizeInit) {
      return;
    }
    this.menuItemSizeInit = true;

    const sizes = await this.getTestMenuItemSizeEntities(testContext);
    testContext.addCleanupFunction(() =>
      this.cleanupMenuItemSizeTestDatabase(),
    );

    await this.sizeService.insertEntities(sizes);
  }

  public async cleanupMenuItemSizeTestDatabase(): Promise<void> {
    await this.sizeService.getQueryBuilder().delete().execute();
  }

  // Menu Item Category
  public async getTestMenuItemCategoryEntities(
    testContext: DatabaseTestContext,
  ): Promise<MenuItemCategory[]> {
    const categoryNames = getTestCategoryNames();
    const results: MenuItemCategory[] = [];

    for (const name of categoryNames) {
      const exists = await this.categoryService.findOneByName(name);
      if (exists) {
        continue;
      }

      results.push(await this.categoryBuilder.reset().name(name).build());
    }
    return results;
  }

  public async initMenuItemCategoryTestDatabase(
    testContext: DatabaseTestContext,
  ): Promise<void> {
    if (this.menuItemCategoryInit) {
      return;
    }
    this.menuItemCategoryInit = true;
    const categories = await this.getTestMenuItemCategoryEntities(testContext);
    testContext.addCleanupFunction(() =>
      this.cleanupMenuItemCategoryTestDatabase(),
    );

    await this.categoryService.insertEntities(categories);
  }

  public async cleanupMenuItemCategoryTestDatabase(): Promise<void> {
    await this.categoryService.getQueryBuilder().delete().execute();
  }

  // Menu Item

  /**
   * Creates Menu Item entities with category and name set
   * @param testContext
   */
  public async getTestMenuItemEntities(
    testContext: DatabaseTestContext,
  ): Promise<MenuItem[]> {
    await this.initMenuItemSizeTestDatabase(testContext);
    await this.initMenuItemCategoryTestDatabase(testContext);

    const itemNames = getTestItemNames();
    const categoryIds = (await this.categoryService.findAll()).items.map(
      (cat) => cat.id,
    );
    let catIdx = 0;
    const sizeIds = (await this.sizeService.findAll()).items.map(
      (size) => size.id,
    );
    let sizeIdx = 0;
    const results: MenuItem[] = [];

    for (const itemName of itemNames) {
      const exists = await this.itemService.findOneByName(itemName);
      if (exists) {
        continue;
      }

      results.push(
        await this.itemBuilder
          .reset()
          .categorybyId(categoryIds[catIdx++ % categoryIds.length])
          .name(itemName)
          .validSizesById([
            sizeIds[sizeIdx++ % sizeIds.length],
            sizeIds[sizeIdx++ % sizeIds.length],
          ])
          .build(),
      );
    }

    return results;
  }

  public async initMenuItemTestDatabase(
    testContext: DatabaseTestContext,
  ): Promise<void> {
    if (this.menuItemInit) {
      return;
    }
    this.menuItemInit = true;
    const items = await this.getTestMenuItemEntities(testContext);
    testContext.addCleanupFunction(() => this.cleanupMenuItemTestDatabase());

    await this.itemService.insertEntities(items);
  }

  public async cleanupMenuItemTestDatabase(): Promise<void> {
    await this.itemService.getQueryBuilder().delete().execute();
  }

  // Menu Item Component

  /**
   * Returns MenuItemComponents where ItemF is a container of items A and B, and itemG is a container of items C and D.
   * @param testContext
   * @returns
   */
  public async getTestMenuItemComponentEntities(
    testContext: DatabaseTestContext,
  ): Promise<MenuItemContainerItem[]> {
    await this.initMenuItemContainerTestDatabase(testContext);

    const itemF = await this.itemService.findOneByName(item_f, ['validSizes']);
    if (!itemF) {
      throw new NotFoundException();
    }
    if (!itemF.validSizes) {
      throw new Error();
    }

    const itemA = await this.itemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new NotFoundException();
    }
    if (!itemA.validSizes) {
      throw new Error();
    }

    const itemB = await this.itemService.findOneByName(item_b, ['validSizes']);
    if (!itemB) {
      throw new NotFoundException();
    }
    if (!itemB.validSizes) {
      throw new Error();
    }

    const itemG = await this.itemService.findOneByName(item_g, ['validSizes']);
    if (!itemG) {
      throw new NotFoundException();
    }
    if (!itemG.validSizes) {
      throw new Error();
    }

    const itemC = await this.itemService.findOneByName(item_c, ['validSizes']);
    if (!itemC) {
      throw new NotFoundException();
    }
    if (!itemC.validSizes) {
      throw new Error();
    }

    const itemD = await this.itemService.findOneByName(item_d, ['validSizes']);
    if (!itemD) {
      throw new NotFoundException();
    }
    if (!itemD.validSizes) {
      throw new Error();
    }

    const results = [
      {
        parentContainer: itemF,
        parentContainerSize: itemF.validSizes[0],
        containedItem: itemA,
        containedItemSize: itemA.validSizes[0],
        quantity: 1,
      },
      {
        parentContainer: itemF,
        parentContainerSize: itemF.validSizes[0],
        containedItem: itemB,
        containedItemSize: itemB.validSizes[0],
        quantity: 1,
      },

      {
        parentContainer: itemG,
        parentContainerSize: itemG.validSizes[0],
        containedItem: itemC,
        containedItemSize: itemC.validSizes[0],
        quantity: 1,
      },
      {
        parentContainer: itemG,
        parentContainerSize: itemG.validSizes[0],
        containedItem: itemD,
        containedItemSize: itemD.validSizes[0],
        quantity: 1,
      },
    ] as MenuItemContainerItem[];

    return results;
  }

  /**
   * Inserts MenuItemComponent Entites into the database
   *
   * ItemF is a container of items A and B,
   *
   * itemG is a container of items C and D.
   * @param testContext
   */
  public async initMenuItemComponentTestDatabase(
    testContext: DatabaseTestContext,
  ): Promise<void> {
    if (this.menuItemComponentInit) {
      return;
    }
    this.menuItemComponentInit = true;
    const components = await this.getTestMenuItemComponentEntities(testContext);
    testContext.addCleanupFunction(() =>
      this.cleanupMenuItemComponentTestDatabase(),
    );

    await this.componentService.insertEntities(components);
  }

  public async cleanupMenuItemComponentTestDatabase(): Promise<void> {
    await this.componentService.getQueryBuilder().delete().execute();
  }

  //Menu Item Component Options
  public async getTestMenuItemContainerEntities(
    testContext: DatabaseTestContext,
  ): Promise<MenuItem[]> {
    await this.initMenuItemTestDatabase(testContext);

    const results: MenuItem[] = [];

    const categoryIds = (await this.categoryService.findAll()).items.map(
      (cat) => cat.id,
    );
    let catIdx = 0;
    const sizeIds = (await this.sizeService.findAll()).items.map(
      (size) => size.id,
    );
    let sizeIdx = 0;

    const itemA = await this.itemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new Error('item a is null');
    }
    if (!itemA.validSizes) {
      throw new Error('item a valid sizes is null');
    }
    const itemB = await this.itemService.findOneByName(item_b, ['validSizes']);
    if (!itemB) {
      throw new Error('item b is null');
    }
    if (!itemB.validSizes) {
      throw new Error('item b valid sizes is null');
    }
    const containerRuleDtos_A = [
      plainToInstance(CreateMenuItemContainerRuleDto, {
        //parentContainerOptionsId: itemA.id,
        validMenuItemId: itemA.id,
        validSizeIds: itemA.validSizes.slice(1).map((size) => size.id),
        //quantity: 2,
      }),
      plainToInstance(CreateMenuItemContainerRuleDto, {
        //parentContainerOptionsId: itemB.id,
        validMenuItemId: itemB.id,
        validSizeIds: itemB.validSizes.slice(1).map((size) => size.id),
        //quantity: 2,
      }),
    ];

    const optionsA = plainToInstance(CreateMenuItemContainerOptionsDto, {
      //parentContainerMenuItemId: itemA.id,
      containerRuleDtos: containerRuleDtos_A,
      validQuantity: 4,
    });

    const itemC = await this.itemService.findOneByName(item_c, ['validSizes']);
    if (!itemC) {
      throw new Error('item c is null');
    }
    if (!itemC.validSizes) {
      throw new Error('item c valid sizes is null');
    }
    const itemD = await this.itemService.findOneByName(item_d, ['validSizes']);
    if (!itemD) {
      throw new Error('item d is null');
    }
    if (!itemD.validSizes) {
      throw new Error('item d valid sizes is null');
    }
    const containerRuleDtos_B = [
      plainToInstance(CreateMenuItemContainerRuleDto, {
        //parentContainerOptionsId: itemC.id,
        validMenuItemId: itemC.id,
        validSizeIds: itemC.validSizes.slice(1).map((size) => size.id),
        //quantity: 3,
      }),
      plainToInstance(CreateMenuItemContainerRuleDto, {
        //parentContainerOptionsId: itemD.id,
        validMenuItemId: itemD.id,
        validSizeIds: itemD.validSizes.slice(1).map((size) => size.id),
        //quantity: 3,
      }),
    ];

    const optionsB = plainToInstance(CreateMenuItemContainerOptionsDto, {
      //parentContainerMenuItemId: itemB.id,
      containerRuleDtos: containerRuleDtos_B,
      validQuantity: 6,
    });

    const sizeOne = await this.sizeService.findOneByName(SIZE_ONE);
    if (!sizeOne) {
      throw new Error('size one is null');
    }
    const definedContainerDto_C = [
      plainToInstance(CreateMenuItemContainerItemDto, {
        parentContainerSizeId: sizeOne.id,
        containedMenuItemId: itemA.id,
        containedMenuItemSizeId: itemA.validSizes[0].id,
        quantity: 2,
      }),
      plainToInstance(CreateMenuItemContainerItemDto, {
        parentContainerSizeId: sizeOne.id,
        containedMenuItemId: itemD.id,
        containedMenuItemSizeId: itemD.validSizes[0].id,
        quantity: 3,
      }),
    ];

    const containerItemNames = getItemContainerTestNames();
    const options = [optionsA, optionsB] as CreateMenuItemContainerOptionsDto[];

    results.push(
      await this.itemBuilder
        .reset()
        .categorybyId(categoryIds[catIdx++ % categoryIds.length])
        .name(containerItemNames[0])
        .validSizesById([
          sizeIds[sizeIdx++ % sizeIds.length],
          sizeIds[sizeIdx++ % sizeIds.length],
        ])
        .containerOptionsByBuilder(options[0])
        .build(),
    );

    results.push(
      await this.itemBuilder
        .reset()
        .categorybyId(categoryIds[catIdx++ % categoryIds.length])
        .name(containerItemNames[1])
        .validSizesById([
          sizeIds[sizeIdx++ % sizeIds.length],
          sizeIds[sizeIdx++ % sizeIds.length],
        ])
        .containerOptionsByBuilder(options[1])
        .build(),
    );

    results.push(
      await this.itemBuilder
        .reset()
        .categorybyId(categoryIds[catIdx++ % categoryIds.length])
        .name(containerItemNames[2])
        .validSizesById([
          sizeIds[sizeIdx++ % sizeIds.length],
          sizeIds[sizeIdx++ % sizeIds.length],
        ])
        .definedContainerItemsByBuilder(definedContainerDto_C)
        .build(),
    );

    return results;
  }

  public async initMenuItemContainerTestDatabase(
    testContext: DatabaseTestContext,
  ): Promise<void> {
    if (this.menuItemContainerOptionsInit) {
      return;
    }
    this.menuItemContainerOptionsInit = true;
    const components = await this.getTestMenuItemContainerEntities(testContext);
    testContext.addCleanupFunction(() =>
      this.cleanupMenuItemContainerTestDatabase(),
    );

    await this.itemService.insertEntities(components);
  }

  public async cleanupMenuItemContainerTestDatabase(): Promise<void> {
    await this.itemService.getQueryBuilder().delete().execute();
    await this.componentOptionService.getQueryBuilder().delete().execute();
    await this.itemcomponentOptionsService.getQueryBuilder().delete().execute();
  }
}
