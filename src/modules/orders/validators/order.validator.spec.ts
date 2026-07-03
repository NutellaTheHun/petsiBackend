import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
  createValidationErrorPayload,
  expectValidationErrorPayload,
  expectValidationErrorSize,
  findValidationErrors,
} from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../dto/order-menu-item/nested-update-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { NestedCreateRecurringOrderScheduleDto } from '../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { orderToUpdateDto } from '../utils/entity-transformers/order.dto.transformer';
import { OCCURRENCE_TYPES } from '../utils/occurence-types';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderValidator } from './order.validator';

const P = `t${Date.now()}`;

describe('order validator', () => {
  let testingUtil: OrderTestingUtil;
  let testCtx: DatabaseTestContext;

  let validator: OrderValidator;

  let orderRepo: Repository<Order>;
  let categoryRepo: Repository<OrderCategory>;
  let orderMenuItemRepo: Repository<OrderMenuItem>;
  let menuItemRepo: Repository<MenuItem>;
  let sizeRepo: Repository<MenuItemSize>;
  let menuItemContainerItemRepo: Repository<MenuItemContainerItem>;
  let menuItemCategoryRepo: Repository<MenuItemCategory>;

  let categories: OrderCategory[];
  let orders: Order[];
  let singleItems: MenuItem[];
  let fixedContainerItems: MenuItem[];
  let varContainerItems: MenuItem[];
  let containerLines: MenuItemContainerItem[];
  let orderMenuItems: OrderMenuItem[];
  let menuItemCategories: MenuItemCategory[];
  let menuItemSizes: MenuItemSize[];

  const linesFor = (menuItemId: number, sizeId: number) =>
    containerLines.filter((l) => l.parentMenuItem.id === menuItemId && l.parentItemSize.id === sizeId);

  // orders[0] and orders[1] already carry seeded container lines (see seedOrderMenuItems);
  // update tests use orders[2], which only has plain single-item lines, to avoid collisions
  // with the fixedContainerItems[0]/varContainerItems[0] combos used below.
  const loadOrder = async (): Promise<Order> => {
    return await orderRepo.findOneOrFail({
      where: { id: orders[2].id },
      relations: [
        'orderedItems',
        'orderedItems.menuItem',
        'orderedItems.size',
        'category',
        'orderedItems.containerOrderMenuItems',
        'orderedItems.containerOrderMenuItems.containedMenuItem',
        'orderedItems.containerOrderMenuItems.containedItemSize',
      ],
    });
  };

  const getNonDuplicateMenuItems = (
    order: Order,
    numberOfItems: number,
    itemType: string = MENU_ITEM_TYPES.SINGLE,
  ) => {
    const pool = itemType === MENU_ITEM_TYPES.SINGLE ? singleItems : [...fixedContainerItems, ...varContainerItems];
    const currentOrderItems = new Set<string>(
      order.orderedItems.map((item) => `${item.menuItem.id}:${item.size?.id}`),
    );
    const results: { itemId: number; sizeId: number }[] = [];
    for (const item of pool) {
      for (const size of item.sizes) {
        const combination = `${item.id}:${size.id}`;
        if (!currentOrderItems.has(combination)) {
          results.push({ itemId: item.id, sizeId: size.id });
          if (results.length >= numberOfItems) {
            return results;
          }
        }
      }
    }
    return results;
  };

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule();
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);

    validator = module.get<OrderValidator>(OrderValidator);

    orderRepo = module.get(getRepositoryToken(Order));
    categoryRepo = module.get(getRepositoryToken(OrderCategory));
    orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));
    sizeRepo = module.get(getRepositoryToken(MenuItemSize));
    menuItemContainerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
    menuItemCategoryRepo = module.get(getRepositoryToken(MenuItemCategory));

    ({ categories, orders, singleItems, fixedContainerItems, varContainerItems, containerLines, orderMenuItems, menuItemCategories, menuItemSizes } =
      await testingUtil.seedOrderMenuItems(P));
  });

  afterAll(async () => {
    await orderMenuItemRepo.delete(orderMenuItems.map((i) => i.id));
    await orderRepo.delete(orders.map((o) => o.id));
    await categoryRepo.delete(categories.map((c) => c.id));
    await menuItemContainerItemRepo.delete(containerLines.map((l) => l.id));
    await menuItemRepo.delete([...singleItems, ...fixedContainerItems, ...varContainerItems].map((i) => i.id));
    await sizeRepo.delete(menuItemSizes.map((s) => s.id));
    await menuItemCategoryRepo.delete(menuItemCategories.map((c) => c.id));
  });

  beforeEach(() => {
    testCtx = new DatabaseTestContext();
  });

  afterEach(async () => {
    await testCtx.executeCleanupFunctions();
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {
    const category = categories[0];
    const singleMenuItem = singleItems[0];
    const anotherMenuItem = singleItems[1];
    const containerMenuItem = fixedContainerItems[0];
    const containerSize = containerMenuItem.sizes[0];

    const validContainerMenuItems = linesFor(containerMenuItem.id, containerSize.id);
    const containedItem = validContainerMenuItems[0].containedMenuItem;
    const containedItemSize = validContainerMenuItems[0].containedItemSize;

    const containedItem2 = validContainerMenuItems[1].containedMenuItem;
    const containedItemSize2 = validContainerMenuItems[1].containedItemSize;

    const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        }),
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c2',
          menuItemId: anotherMenuItem.id,
          sizeId: anotherMenuItem.sizes[0].id,
          quantity: 3,
        }),
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c3',
          menuItemId: anotherMenuItem.id,
          sizeId: anotherMenuItem.sizes[1].id,
          quantity: 4,
        }),
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c4',
          menuItemId: containerMenuItem.id,
          sizeId: containerSize.id,
          quantity: 1,
          containerOrderMenuItems: [
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c5',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 2,
              parentMenuItemIdCtx: containerMenuItem.id,
              parentMenuItemSizeIdCtx: containerSize.id,
            }),
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c6',
              containedMenuItemId: containedItem2.id,
              containedItemSizeId: containedItemSize2.id,
              quantity: 3,
              parentMenuItemIdCtx: containerMenuItem.id,
              parentMenuItemSizeIdCtx: containerSize.id,
            }),
          ],
        }),
      ],
    });

    const errors = await validator.validateDto(dto, 'root');
    expect(errors).toBeNull();
  });

  it('fail validate create: invalid fulfillment type', async () => {
    const category = categories[0];
    const singleMenuItem = singleItems[0];

    const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'invalid_type',
      categoryId: category.id,
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        }),
      ],
    });

    const errors = await validator.validateDto(dto, 'root');
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'fulfillmentType',
      ]),
    );
  });

  it('fail validate create: order for delivery must have a delivery address', async () => {
    const category = categories[0];
    const singleMenuItem = singleItems[0];

    const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'delivery',
      phoneNumber: '1234567890',
      categoryId: category.id,
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        }),
      ],
    });

    const errors = await validator.validateDto(dto, 'root');
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [],
      createValidationErrorPayload('MISSING_PROPERTY', undefined, [
        'deliveryAddress',
      ]),
    );
  });

  it('fail validate create: order for delivery must have a phone number', async () => {
    const category = categories[0];
    const singleMenuItem = singleItems[0];

    const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'delivery',
      deliveryAddress: '123 Main St',
      categoryId: category.id,
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        }),
      ],
    });

    const errors = await validator.validateDto(dto, 'root');
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [],
      createValidationErrorPayload('MISSING_PROPERTY', undefined, [
        'phoneNumber',
      ]),
    );
  });

  it('fail validate create: duplicate ordered items', async () => {
    const category = categories[0];
    const singleMenuItem = singleItems[0];

    const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        }),
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c2',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 3,
        }),
      ],
    });

    const errors = await validator.validateDto(dto, 'root');
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [],
      createValidationErrorPayload(
        'DUPLICATE_ITEMS',
        ['c1', 'c2'],
        ['orderedItems'],
      ),
    );
  });

  // Validate Create: Invalid contained item

  it('fail validate create: nested orderedItems validator errors: contained item size not valid', async () => {
    const category = categories[0];
    const containerMenuItem = fixedContainerItems[1];
    const containerSize = containerMenuItem.sizes[0];
    const lines = linesFor(containerMenuItem.id, containerSize.id);
    const containedItem = lines[0].containedMenuItem;
    const allSizes = await sizeRepo.find();
    const invalidSize = allSizes.find(
      (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
    );
    if (!invalidSize) {
      throw new Error('invalid size not found');
    }
    const invalidSizeId = invalidSize.id;

    const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerSize.id,
          quantity: 1,
          containerOrderMenuItems: [
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: invalidSizeId,
              quantity: 2,
              parentMenuItemIdCtx: containerMenuItem.id,
              parentMenuItemSizeIdCtx: containerSize.id,
            }),
          ],
        }),
      ],
    });

    const errors = await validator.validateDto(dto, 'root');
    expectValidationErrorSize(errors, 1);
    const path = [
      { prop: 'orderedItems', id: 'c1' },
      { prop: 'containerOrderMenuItems', id: 'c2' },
    ];
    const errs = errors ? findValidationErrors(errors, path) : null;
    expect(errs).not.toBeNull();

    const expectedA = createValidationErrorPayload(
      'INVALID_PROPERTY_VALUE',
      undefined,
      ['containedItemSize'],
    );
    const expectedB = createValidationErrorPayload(
      'INVALID_PROPERTY_VALUE',
      undefined,
      ['containedMenuItem'],
    );
    const arr = errs as any[];
    const matches =
      arr.some((e) => JSON.stringify(e) === JSON.stringify(expectedA)) ||
      arr.some((e) => JSON.stringify(e) === JSON.stringify(expectedB));
    expect(matches).toBe(true);
  });

  it('fail validate create: nested orderedItems validator errors: quantity with value 0', async () => {
    const category = categories[0];
    const singleMenuItem = singleItems[0];

    const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 0,
        }),
      ],
    });

    const errors = await validator.validateDto(dto, 'root');
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [{ prop: 'orderedItems', id: 'c1' }],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'quantity',
      ]),
    );
  });

  it('fail validate create: nested orderedItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
    const category = categories[0];
    const containerMenuItem = varContainerItems[0];
    if (!containerMenuItem.variableMaxAmount) {
      throw new Error('container menu item does not have variableMaxAmount');
    }
    const containerSize = containerMenuItem.sizes[0];
    const lines = linesFor(containerMenuItem.id, containerSize.id);
    const containedItem = lines[0].containedMenuItem;
    const containedItemSize = lines[0].containedItemSize;

    const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerSize.id,
          quantity: 1,
          containerOrderMenuItems: [
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: containerMenuItem.variableMaxAmount + 1,
              parentMenuItemIdCtx: containerMenuItem.id,
              parentMenuItemSizeIdCtx: containerSize.id,
            }),
          ],
        }),
      ],
    });

    const errors = await validator.validateDto(dto, 'root');
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [{ prop: 'orderedItems', id: 'c1' }],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'containerOrderMenuItems',
      ]),
    );
  });

  it('fail validate create: nested orderedItems validator errors: duplicate container item', async () => {
    const category = categories[0];
    const containerMenuItem = fixedContainerItems[0];
    const containerSize = containerMenuItem.sizes[0];
    const lines = linesFor(containerMenuItem.id, containerSize.id);
    const containedItem = lines[0].containedMenuItem;
    const containedItemSize = lines[0].containedItemSize;

    const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerSize.id,
          quantity: 1,
          containerOrderMenuItems: [
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 2,
              parentMenuItemIdCtx: containerMenuItem.id,
              parentMenuItemSizeIdCtx: containerSize.id,
            }),
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c3',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 3,
              parentMenuItemIdCtx: containerMenuItem.id,
              parentMenuItemSizeIdCtx: containerSize.id,
            }),
          ],
        }),
      ],
    });

    const errors = await validator.validateDto(dto, 'root');
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [{ prop: 'orderedItems', id: 'c1' }],
      createValidationErrorPayload(
        'DUPLICATE_ITEMS',
        ['c2', 'c3'],
        ['containerOrderMenuItems'],
      ),
    );
  });

  it('fail validate create: nested orderedItems validator errors: nested orderContainerItem validator errors: quantity with value 0', async () => {
    const category = categories[0];
    const containerMenuItem = fixedContainerItems[0];
    const containerSize = containerMenuItem.sizes[0];
    const lines = linesFor(containerMenuItem.id, containerSize.id);
    const containedItem = lines[0].containedMenuItem;
    const containedItemSize = lines[0].containedItemSize;

    const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerSize.id,
          quantity: 1,
          containerOrderMenuItems: [
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 0,
              parentMenuItemIdCtx: containerMenuItem.id,
              parentMenuItemSizeIdCtx: containerSize.id,
            }),
          ],
        }),
      ],
    });

    const errors = await validator.validateDto(dto, 'root');
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
      ],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'quantity',
      ]),
    );
  });

  // Validate Create: Invalid recurrence schedule
  it('fail validate create: invalid recurrence schedule, frequency is invalid', async () => {
    const category = categories[0];
    const singleMenuItem = singleItems[0];
    const anotherMenuItem = singleItems[1];

    const recurrenceSchedule = plainToInstance(
      NestedCreateRecurringOrderScheduleDto,
      {
        createId: 'r1',
        frequency: 'INVALID',
        interval: 1,
        daysOfWeek: [6],
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      },
    );

    const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        }),
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c2',
          menuItemId: anotherMenuItem.id,
          sizeId: anotherMenuItem.sizes[0].id,
          quantity: 3,
        }),
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c3',
          menuItemId: anotherMenuItem.id,
          sizeId: anotherMenuItem.sizes[1].id,
          quantity: 4,
        }),
      ],
      recurrenceSchedule: recurrenceSchedule,
      occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
    });

    const errors = await validator.validateDto(dto, 'root');
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [{ prop: 'recurrenceSchedule' }],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'frequency',
      ]),
    );
  });

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {
    const orderToUpdate = await loadOrder();

    const singleMenuItem = singleItems[6];
    const newCategory = categories[0];

    const containerMenuItem = fixedContainerItems[0];
    const containerSize = containerMenuItem.sizes[0];
    const validContainerMenuItems = linesFor(containerMenuItem.id, containerSize.id);
    const containedItem = validContainerMenuItems[0].containedMenuItem;
    const containedItemSize = validContainerMenuItems[0].containedItemSize;

    const containedItem2 = validContainerMenuItems[1].containedMenuItem;
    const containedItemSize2 = validContainerMenuItems[1].containedItemSize;

    const dto = orderToUpdateDto(orderToUpdate, {
      fulfillmentContactName: 'Updated Contact Name',
      email: 'updated@example.com',
      isFrozen: false,
      recipient: 'Updated Recipient',
      fulfillmentDate: new Date(),
      fulfillmentType: 'delivery',
      deliveryAddress: '123 Main St',
      phoneNumber: '1234567890',
      categoryId: newCategory.id,
      note: 'Updated Note',
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 3,
          containerOrderMenuItems: [],
        }),
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c2',
          menuItemId: containerMenuItem.id,
          sizeId: containerSize.id,
          quantity: 1,
          containerOrderMenuItems: [
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c3',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 2,
              parentMenuItemIdCtx: containerMenuItem.id,
              parentMenuItemSizeIdCtx: containerSize.id,
            }),
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c4',
              containedMenuItemId: containedItem2.id,
              containedItemSizeId: containedItemSize2.id,
              quantity: 3,
              parentMenuItemIdCtx: containerMenuItem.id,
              parentMenuItemSizeIdCtx: containerSize.id,
            }),
          ],
        }),
      ],
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expect(errors).toBeNull();
  });

  it('fail validate update: invalid fulfillment type', async () => {
    const orderToUpdate = await loadOrder();

    const dto = orderToUpdateDto(orderToUpdate, {
      fulfillmentType: 'invalid_type',
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'fulfillmentType',
      ]),
    );
  });

  it('fail validate update: order for delivery must have a delivery address', async () => {
    const orderToUpdate = await loadOrder();

    const dto = orderToUpdateDto(orderToUpdate, {
      fulfillmentType: 'delivery',
      phoneNumber: '1234567890',
      deliveryAddress: null,
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [],
      createValidationErrorPayload('MISSING_PROPERTY', undefined, [
        'deliveryAddress',
      ]),
    );
  });

  it('fail validate update: order for delivery must have a phone number', async () => {
    const orderToUpdate = await loadOrder();

    const dto = orderToUpdateDto(orderToUpdate, {
      fulfillmentType: 'delivery',
      deliveryAddress: '123 Main St',
      phoneNumber: null,
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [],
      createValidationErrorPayload('MISSING_PROPERTY', undefined, [
        'phoneNumber',
      ]),
    );
  });

  it('fail validate update: duplicate ordered items', async () => {
    const orderToUpdate = await loadOrder();

    const duplicateItem = orderToUpdate.orderedItems[0];

    const dto = orderToUpdateDto(orderToUpdate, {
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: duplicateItem.menuItem.id,
          sizeId: duplicateItem.size?.id ?? 0,
          quantity: duplicateItem.quantity,
          containerOrderMenuItems: [],
        },
      ],
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [],
      createValidationErrorPayload(
        'DUPLICATE_ITEMS',
        ['c1', duplicateItem.id],
        ['orderedItems'],
      ),
    );
  });

  it('fail validate update: nested orderedItems validator errors: contained item size not valid', async () => {
    const orderToUpdate = await loadOrder();
    const validContainerMenuItem = getNonDuplicateMenuItems(
      orderToUpdate,
      1,
      MENU_ITEM_TYPES.CONTAINER,
    );
    const containerMenuItem = validContainerMenuItem[0];

    const validContainerMenuItems = linesFor(containerMenuItem.itemId, containerMenuItem.sizeId);
    const containedItem = validContainerMenuItems[0].containedMenuItem;
    const containedItemSize = validContainerMenuItems[0].containedItemSize;
    const invalidSize = containedItem.sizes.find(
      (s) => s.id !== containedItemSize.id,
    );
    if (!invalidSize) {
      throw new Error('invalid size not found');
    }

    const dto = orderToUpdateDto(orderToUpdate, {
      orderedItems: [
        plainToInstance(NestedUpdateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: containerMenuItem.itemId,
          sizeId: containerMenuItem.sizeId,
          quantity: 1,
          containerOrderMenuItems: [
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: invalidSize.id,
              quantity: 2,
              parentMenuItemIdCtx: containerMenuItem.itemId,
              parentMenuItemSizeIdCtx: containerMenuItem.sizeId,
            }),
          ],
        }),
      ],
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
      ],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'containedItemSize',
      ]),
    );
  });

  it('fail validate update: nested orderedItems validator errors: quantity with value 0', async () => {
    const orderToUpdate = await loadOrder();
    const validMenuItem = getNonDuplicateMenuItems(
      orderToUpdate,
      1,
      MENU_ITEM_TYPES.SINGLE,
    );
    const singleMenuItem = validMenuItem[0];

    const dto = orderToUpdateDto(orderToUpdate, {
      orderedItems: [
        plainToInstance(NestedUpdateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: singleMenuItem.itemId,
          sizeId: singleMenuItem.sizeId,
          quantity: 0,
        }),
      ],
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [{ prop: 'orderedItems', id: 'c1' }],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'quantity',
      ]),
    );
  });

  it('fail validate update: nested orderedItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
    const orderToUpdate = await loadOrder();
    const containerMenuItem = varContainerItems[0];
    if (!containerMenuItem.variableMaxAmount) {
      throw new Error('container menu item variable max amount not found');
    }
    const containerSize = containerMenuItem.sizes[0];
    const validContainerMenuItems = linesFor(containerMenuItem.id, containerSize.id);
    const containedItem = validContainerMenuItems[0].containedMenuItem;
    const containedItemSize = validContainerMenuItems[0].containedItemSize;

    const dto = orderToUpdateDto(orderToUpdate, {
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerSize.id,
          quantity: 1,
          containerOrderMenuItems: [
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: containerMenuItem.variableMaxAmount + 1,
              parentMenuItemIdCtx: containerMenuItem.id,
              parentMenuItemSizeIdCtx: containerSize.id,
            }),
          ],
        }),
      ],
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [{ prop: 'orderedItems', id: 'c1' }],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'containerOrderMenuItems',
      ]),
    );
  });

  it('fail validate update: nested orderedItems validator errors: duplicate container item', async () => {
    const orderToUpdate = await loadOrder();
    const validContainerMenuItem = getNonDuplicateMenuItems(
      orderToUpdate,
      1,
      MENU_ITEM_TYPES.CONTAINER,
    );
    const containerMenuItem = validContainerMenuItem[0];
    const validContainerMenuItems = linesFor(containerMenuItem.itemId, containerMenuItem.sizeId);
    const containedItem = validContainerMenuItems[0].containedMenuItem;
    const containedItemSize = validContainerMenuItems[0].containedItemSize;

    const dto = orderToUpdateDto(orderToUpdate, {
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: containerMenuItem.itemId,
          sizeId: containerMenuItem.sizeId,
          quantity: 1,
          containerOrderMenuItems: [
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 2,
              parentMenuItemIdCtx: containerMenuItem.itemId,
              parentMenuItemSizeIdCtx: containerMenuItem.sizeId,
            }),
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c3',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 3,
              parentMenuItemIdCtx: containerMenuItem.itemId,
              parentMenuItemSizeIdCtx: containerMenuItem.sizeId,
            }),
          ],
        }),
      ],
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [{ prop: 'orderedItems', id: 'c1' }],
      createValidationErrorPayload(
        'DUPLICATE_ITEMS',
        ['c2', 'c3'],
        ['containerOrderMenuItems'],
      ),
    );
  });

  it('fail validate update: nested orderedItems validator errors: nested orderContainerItem validator errors: contained item size not valid', async () => {
    const orderToUpdate = await loadOrder();
    const validContainerMenuItem = getNonDuplicateMenuItems(
      orderToUpdate,
      1,
      MENU_ITEM_TYPES.CONTAINER,
    );
    const containerMenuItem = validContainerMenuItem[0];
    const validContainerMenuItems = linesFor(containerMenuItem.itemId, containerMenuItem.sizeId);
    const containedItem = validContainerMenuItems[0].containedMenuItem;
    const containedItemSize = validContainerMenuItems[0].containedItemSize;
    const invalidSize = containedItem.sizes.find(
      (s) => s.id !== containedItemSize.id,
    );
    if (!invalidSize) {
      throw new Error('invalid size not found');
    }

    const dto = orderToUpdateDto(orderToUpdate, {
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: containerMenuItem.itemId,
          sizeId: containerMenuItem.sizeId,
          quantity: 1,
          containerOrderMenuItems: [
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: invalidSize.id,
              quantity: 2,
              parentMenuItemIdCtx: containerMenuItem.itemId,
              parentMenuItemSizeIdCtx: containerMenuItem.sizeId,
            }),
          ],
        }),
      ],
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
      ],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'containedItemSize',
      ]),
    );
  });

  it('fail validate update: nested orderedItems validator errors: nested orderContainerItem validator errors: quantity with value 0', async () => {
    const orderToUpdate = await loadOrder();
    const validContainerMenuItem = getNonDuplicateMenuItems(
      orderToUpdate,
      1,
      MENU_ITEM_TYPES.CONTAINER,
    );
    const containerMenuItem = validContainerMenuItem[0];
    const validContainerMenuItems = linesFor(containerMenuItem.itemId, containerMenuItem.sizeId);
    const containedItem = validContainerMenuItems[0].containedMenuItem;
    const containedItemSize = validContainerMenuItems[0].containedItemSize;

    const dto = orderToUpdateDto(orderToUpdate, {
      orderedItems: [
        plainToInstance(NestedCreateOrderMenuItemDto, {
          createId: 'c1',
          menuItemId: containerMenuItem.itemId,
          sizeId: containerMenuItem.sizeId,
          quantity: 1,
          containerOrderMenuItems: [
            plainToInstance(NestedCreateOrderContainerItemDto, {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 0,
              parentMenuItemIdCtx: containerMenuItem.itemId,
              parentMenuItemSizeIdCtx: containerMenuItem.sizeId,
            }),
          ],
        }),
      ],
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
      ],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'quantity',
      ]),
    );
  });

  it('fail validate update: invalid recurrence schedule, frequency is invalid', async () => {
    const orderToUpdate = await loadOrder();
    const recurrenceSchedule = plainToInstance(
      NestedCreateRecurringOrderScheduleDto,
      {
        createId: 'c1',
        frequency: 'INVALID',
        interval: 1,
        daysOfWeek: [6],
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      },
    );

    const dto = orderToUpdateDto(orderToUpdate, {
      recurrenceSchedule: recurrenceSchedule,
      occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
    });

    const errors = await validator.validateDto(dto, orderToUpdate.id);
    expectValidationErrorSize(errors, 1);
    expectValidationErrorPayload(
      errors,
      [{ prop: 'recurrenceSchedule' }],
      createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
        'frequency',
      ]),
    );
  });
});
