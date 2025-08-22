import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { MenuItemContainerOptionsService } from '../../menu-items/services/menu-item-container-options.service';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { NestedOrderMenuItemDto } from '../dto/order-menu-item/nested-order-menu-item.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { OrderCategoryService } from '../services/order-category.service';
import { OrderMenuItemService } from '../services/order-menu-item.service';
import { OrderService } from '../services/order.service';
import { getTestOrderCategoryNames } from './constants';

@Injectable()
export class OrderTestingUtil {
  private orderTypeInit: boolean;
  private orderInit: boolean;
  private orderMenuItemInit: boolean;
  constructor(
    private readonly orderMenuItemService: OrderMenuItemService,
    private readonly categoryService: OrderCategoryService,
    private readonly orderService: OrderService,

    private readonly menuItemService: MenuItemService,
    private readonly menuItemTestUtil: MenuItemTestingUtil,
    private readonly optionService: MenuItemContainerOptionsService,
  ) {
    this.orderTypeInit = false;
    this.orderInit = false;
    this.orderMenuItemInit = false;
  }

  // Order Type
  public async getTestOrderTypeEntities(
    testContext: DatabaseTestContext,
  ): Promise<OrderCategory[]> {
    const names = getTestOrderCategoryNames();
    const results: OrderCategory[] = [];

    for (const name of names) {
      results.push({
        categoryName: name,
      } as OrderCategory);
    }

    return results;
  }

  public async initOrderCategoryTestDatabase(
    testContext: DatabaseTestContext,
  ): Promise<void> {
    if (this.orderTypeInit) {
      return;
    }
    this.orderTypeInit = true;

    const types = await this.getTestOrderTypeEntities(testContext);
    testContext.addCleanupFunction(() => this.cleanupOrderTypeTestDatabase());

    await this.categoryService.insertEntities(types);
  }

  public async cleanupOrderTypeTestDatabase(): Promise<void> {
    await this.categoryService.getQueryBuilder().delete().execute();
  }

  // Order Menu Item
  public async getTestOrderMenuItemEntities(
    testContext: DatabaseTestContext,
  ): Promise<OrderMenuItem[]> {
    await this.initOrderTestDatabase(testContext);
    await this.menuItemTestUtil.initMenuItemContainerTestDatabase(testContext);

    const ordersRequest = await this.orderService.findAll();
    const orders = ordersRequest.items;
    if (!orders) {
      throw new Error();
    }

    const menuItemsRequest = await this.menuItemService.findAll({
      relations: ['validSizes'],
    });
    const menuItems = menuItemsRequest.items;
    if (!menuItems) {
      throw new Error();
    }

    let menuItemIdx = 0;
    let quantity = 1;
    let sizeIdx = 0;
    const results: OrderMenuItem[] = [];

    for (const order of orders) {
      for (let i = 0; i < 4; i++) {
        const menuItem = menuItems[menuItemIdx++ % menuItems.length];
        if (!menuItem.validSizes) {
          throw new Error();
        }

        const size =
          menuItem.validSizes[sizeIdx++ % menuItem.validSizes?.length];

        results.push({
          order: order,
          menuItem,
          quantity: quantity++,
          size,
        } as OrderMenuItem);
      }
    }

    //Order Menu Item Components
    //if(!menuItems[0].validSizes){ throw new Error(); }
    const items = (
      await this.menuItemService.findAll({ relations: ['containerOptions'] })
    ).items;
    const containerItems = items.filter((item) => item.containerOptions);

    const parentOrderItem = {
      order: orders[0],
      menuItem: containerItems[0],
      quantity: 1,
      size: menuItems[0].validSizes[0],
    } as OrderMenuItem;

    if (!containerItems[0].containerOptions) {
      throw new Error();
    }
    const options = await this.optionService.findOne(
      containerItems[0].containerOptions.id,
    );
    if (!options) {
      throw new Error();
    }

    const comp_a = {
      parentOrderItem: parentOrderItem,
      containedItem: options.containerRules[0].validItem,
      containedItemSize: options.containerRules[0].validSizes[0],
      quantity: 1,
    } as OrderContainerItem;

    if (!menuItems[2].validSizes) {
      throw new Error();
    }
    const comp_b = {
      parentOrderItem: parentOrderItem,
      containedItem: options.containerRules[1].validItem,
      containedItemSize: options.containerRules[1].validSizes[0],
      quantity: 1,
    } as OrderContainerItem;

    parentOrderItem.orderedContainerItems = [comp_a, comp_b];
    results.push(parentOrderItem);

    return results;
  }

  public async initOrderMenuItemTestDatabase(
    testContext: DatabaseTestContext,
  ): Promise<void> {
    if (this.orderMenuItemInit) {
      return;
    }
    this.orderMenuItemInit = true;

    const oMenuItems = await this.getTestOrderMenuItemEntities(testContext);
    testContext.addCleanupFunction(() =>
      this.cleanupOrderMenuItemTestDatabase(),
    );

    await this.orderMenuItemService.insertEntities(oMenuItems);
  }

  public async cleanupOrderMenuItemTestDatabase(): Promise<void> {
    await this.orderMenuItemService.getQueryBuilder().delete().execute();
  }

  // Order
  public async getTestOrderEntities(
    testContext: DatabaseTestContext,
  ): Promise<Order[]> {
    await this.initOrderCategoryTestDatabase(testContext);

    const recipients: string[] = [
      'recipient_a',
      'recipient_b',
      'recipient_c',
      'recipient_d',
      'recipient_e',
      'recipient_f',
      'recipient_g',
    ];

    const fulfilltype: string[] = ['fulfilltype_a', 'fulfilltype_b'];
    let fIdx = 0;

    const orderTypesRequest = await this.categoryService.findAll();
    const orderTypes = orderTypesRequest.items;
    if (!orderTypes) {
      throw new Error();
    }
    let otIndex = 0;

    const results: Order[] = [];
    let idx = 0;

    const fulfillmentDate = new Date();
    fulfillmentDate.setDate(fulfillmentDate.getDate() + idx);

    for (const name of recipients) {
      results.push({
        orderCategory: orderTypes[otIndex++ % orderTypes.length],
        recipient: name,
        fulfillmentDate,
        fulfillmentType: fulfilltype[fIdx++ % fulfilltype.length],
        deliveryAddress: 'delAddress' + idx,
        phoneNumber: 'number' + idx,
        email: 'email' + idx,
        note: 'note' + idx,
        isFrozen: false,
        isWeekly: false,
      } as Order);
      idx++;
    }
    return results;
  }

  public async initOrderTestDatabase(
    testContext: DatabaseTestContext,
  ): Promise<void> {
    if (this.orderInit) {
      return;
    }
    this.orderInit = true;

    const orders = await this.getTestOrderEntities(testContext);
    testContext.addCleanupFunction(() => this.cleanupOrderTestDatabase());

    await this.orderService.insertEntities(orders);
  }

  public async cleanupOrderTestDatabase(): Promise<void> {
    await this.orderService.getQueryBuilder().delete().execute();
  }

  // Dtos

  public async createNestedOrderMenuItemDtos(
    amount: number,
  ): Promise<NestedOrderMenuItemDto[]> {
    const itemsRequest = await this.menuItemService.findAll({
      relations: ['validSizes'],
    });
    const items = itemsRequest.items;
    if (!items) {
      throw new Error();
    }

    const results: NestedOrderMenuItemDto[] = [];
    for (let i = 0; i < amount; i++) {
      const item = items[i % items.length];
      if (!item.validSizes) {
        throw new Error();
      }
      if (item.validSizes.length === 0) {
        throw new Error();
      }

      results.push(
        plainToInstance(NestedOrderMenuItemDto, {
          mode: 'create',
          createDto: {
            menuItemId: item.id,
            quantity: 1,
            menuItemSizeId: item.validSizes[0].id,
          },
        }),
      );
    }

    return results;
  }
}
