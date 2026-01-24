import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategoryBuilder } from '../builders/menu-item-category.builder';
import { MenuItemSizeBuilder } from '../builders/menu-item-size.builder';
import { MenuItemBuilder } from '../builders/menu-item.builder';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import {
  getTestCategoryNames,
  getTestItemNames,
  getTestSizeNames,
  item_a,
  item_b,
  item_c,
  item_d,
  item_f,
  item_g,
} from './constants';
import { MENU_ITEM_TYPES } from './menu-item-type';

@Injectable()
export class MenuItemTestingUtil {
  private menuItemSizeInit = false;
  private menuItemCategoryInit = false;
  private menuItemInit = false;
  private menuItemContainerItemInit = false;

  constructor(
    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,
    @InjectRepository(MenuItemSize)
    private readonly sizeRepo: Repository<MenuItemSize>,
    @InjectRepository(MenuItemCategory)
    private readonly categoryRepo: Repository<MenuItemCategory>,
    @InjectRepository(MenuItemContainerItem)
    private readonly containerItemRepo: Repository<MenuItemContainerItem>,

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
      const exists = await this.sizeRepo.findOne({ where: { name } });
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

    testContext.addCleanupFunction(() =>
      this.cleanupMenuItemSizeTestDatabase(),
    );
    await this.sizeRepo.insert(
      await this.getTestMenuItemSizeEntities(testContext),
    );
  }

  public async cleanupMenuItemSizeTestDatabase(): Promise<void> {
    await this.sizeRepo.delete({});
  }

  // Menu Item Category
  public async getTestMenuItemCategoryEntities(
    testContext: DatabaseTestContext,
  ): Promise<MenuItemCategory[]> {
    const categoryNames = getTestCategoryNames();
    const results: MenuItemCategory[] = [];

    for (const name of categoryNames) {
      const exists = await this.categoryRepo.findOne({ where: { name } });
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

    testContext.addCleanupFunction(() =>
      this.cleanupMenuItemCategoryTestDatabase(),
    );
    await this.categoryRepo.insert(
      await this.getTestMenuItemCategoryEntities(testContext),
    );
  }

  public async cleanupMenuItemCategoryTestDatabase(): Promise<void> {
    await this.categoryRepo.delete({});
  }

  // Menu Item

  /**
   * Creates Menu Item entities, entities with name ItemF and ItemG are of type container, with itemG having a variableMaxAmount of 3, all other entities are of type single
   * @param testContext
   */
  public async getTestMenuItemEntities(
    testContext: DatabaseTestContext,
  ): Promise<MenuItem[]> {
    await this.initMenuItemSizeTestDatabase(testContext);
    await this.initMenuItemCategoryTestDatabase(testContext);

    const itemNames = getTestItemNames();
    const categoryIds = (await this.categoryRepo.find()).map((cat) => cat.id);
    let catIdx = 0;
    const sizeIds = (await this.sizeRepo.find()).map((size) => size.id);
    let sizeIdx = 0;
    const results: MenuItem[] = [];

    for (const itemName of itemNames) {
      const exists = await this.itemRepo.findOne({ where: { name: itemName } });
      if (exists) {
        continue;
      }

      let type = MENU_ITEM_TYPES.SINGLE;
      let variableMaxAmount: number | null = null;
      if (itemName === item_f || itemName === item_g) {
        type = MENU_ITEM_TYPES.CONTAINER;
        if (itemName === item_g) {
          variableMaxAmount = 3;
        }
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
          .type(type)
          .variableMaxAmount(variableMaxAmount)
          .build(),
      );

      variableMaxAmount = null;
      type = MENU_ITEM_TYPES.SINGLE;
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

    testContext.addCleanupFunction(() => this.cleanupMenuItemTestDatabase());
    await this.itemRepo.insert(await this.getTestMenuItemEntities(testContext));
  }

  public async cleanupMenuItemTestDatabase(): Promise<void> {
    await this.itemRepo.delete({});
  }

  // Menu Item Component

  /**
   * Returns MenuItemComponents where ItemF is a container of items A and B, and itemG is a container of items C and D.
   * @param testContext
   * @returns
   */
  public async getTestMenuItemContainerItemEntities(
    testContext: DatabaseTestContext,
  ): Promise<MenuItemContainerItem[]> {
    await this.initMenuItemTestDatabase(testContext);

    // Parent
    const itemF = await this.itemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!itemF) {
      throw new NotFoundException();
    }
    if (!itemF.sizes) {
      throw new Error();
    }

    // Child to F
    const itemA = await this.itemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!itemA) {
      throw new NotFoundException();
    }
    if (!itemA.sizes) {
      throw new Error();
    }

    // Child to F
    const itemB = await this.itemRepo.findOne({
      where: { name: item_b },
      relations: ['sizes'],
    });
    if (!itemB) {
      throw new NotFoundException();
    }
    if (!itemB.sizes) {
      throw new Error();
    }

    // Parent
    const itemG = await this.itemRepo.findOne({
      where: { name: item_g },
      relations: ['sizes'],
    });
    if (!itemG) {
      throw new NotFoundException();
    }
    if (!itemG.sizes) {
      throw new Error();
    }

    // Child to G
    const itemC = await this.itemRepo.findOne({
      where: { name: item_c },
      relations: ['sizes'],
    });
    if (!itemC) {
      throw new NotFoundException();
    }
    if (!itemC.sizes) {
      throw new Error();
    }

    // Child to G
    const itemD = await this.itemRepo.findOne({
      where: { name: item_d },
      relations: ['sizes'],
    });
    if (!itemD) {
      throw new NotFoundException();
    }
    if (!itemD.sizes) {
      throw new Error();
    }

    const results = [
      {
        parentMenuItem: itemF,
        parentItemSize: itemF.sizes[0],
        containedMenuItem: itemA,
        containedItemSize: itemA.sizes[0],
        quantity: 3,
      },
      {
        parentMenuItem: itemF,
        parentItemSize: itemF.sizes[0],
        containedMenuItem: itemB,
        containedItemSize: itemB.sizes[0],
        quantity: 3,
      },

      {
        parentMenuItem: itemG,
        parentItemSize: itemG.sizes[0],
        containedMenuItem: itemC,
        containedItemSize: itemC.sizes[0],
        quantity: 3,
      },
      {
        parentMenuItem: itemG,
        parentItemSize: itemG.sizes[0],
        containedMenuItem: itemD,
        containedItemSize: itemD.sizes[0],
        quantity: 3,
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
  public async initMenuItemContainerItemTestDatabase(
    testContext: DatabaseTestContext,
  ): Promise<void> {
    if (this.menuItemContainerItemInit) {
      return;
    }
    this.menuItemContainerItemInit = true;
    testContext.addCleanupFunction(() =>
      this.cleanupMenuItemContainerItemTestDatabase(),
    );

    await this.containerItemRepo.insert(
      await this.getTestMenuItemContainerItemEntities(testContext),
    );
  }

  public async cleanupMenuItemContainerItemTestDatabase(): Promise<void> {
    await this.containerItemRepo.delete({});
  }
}
