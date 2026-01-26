import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationMessage } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_a, item_f } from '../../menu-items/utils/constants';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { TYPE_A } from '../utils/constants';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderValidator } from './order.validator';

describe('order validator', () => {
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: OrderValidator;

  let orderRepo: Repository<Order>;
  let categoryRepo: Repository<OrderCategory>;
  let orderItemRepo: Repository<OrderMenuItem>;
  let menuItemRepo: Repository<MenuItem>;
  let sizeRepo: Repository<MenuItemSize>;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

    validator = module.get<OrderValidator>(OrderValidator);

    orderRepo = module.get(getRepositoryToken(Order));
    categoryRepo = module.get(getRepositoryToken(OrderCategory));
    orderItemRepo = module.get(getRepositoryToken(OrderMenuItem));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));
    sizeRepo = module.get(getRepositoryToken(MenuItemSize));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const singleMenuItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleMenuItem) {
      throw new Error('single menu item not found');
    }
    if (!singleMenuItem.sizes || singleMenuItem.sizes.length === 0) {
      throw new Error('single menu item sizes not found');
    }

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expect(errors).toBeNull();
  });

  it('fail validate create: no ordered items', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'orderedItems' }],
      'Order has no items',
    );
  });

  it('fail validate create: invalid fulfillment type', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const singleMenuItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleMenuItem) {
      throw new Error('single menu item not found');
    }
    if (!singleMenuItem.sizes || singleMenuItem.sizes.length === 0) {
      throw new Error('single menu item sizes not found');
    }

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'invalid_type',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'fulfillmentType' }],
      'Invalid fulfillmentType value',
    );
  });

  it('fail validate create: order for delivery must have a delivery address', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const singleMenuItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleMenuItem) {
      throw new Error('single menu item not found');
    }
    if (!singleMenuItem.sizes || singleMenuItem.sizes.length === 0) {
      throw new Error('single menu item sizes not found');
    }

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'delivery',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'deliveryAddress' }],
      'Order for delivery must have a delivery address',
    );
  });

  it('fail validate create: order for delivery must have a phone number', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const singleMenuItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleMenuItem) {
      throw new Error('single menu item not found');
    }
    if (!singleMenuItem.sizes || singleMenuItem.sizes.length === 0) {
      throw new Error('single menu item sizes not found');
    }

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'delivery',
      deliveryAddress: '123 Main St',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'phoneNumber' }],
      'Order for delivery must have a delivery address',
    );
  });

  it('fail validate create: order must have a day of the week selected for fulfillment', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const singleMenuItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleMenuItem) {
      throw new Error('single menu item not found');
    }
    if (!singleMenuItem.sizes || singleMenuItem.sizes.length === 0) {
      throw new Error('single menu item sizes not found');
    }

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      isWeekly: true,
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'weeklyFulfillment' }],
      'Order must have a day of the week selected for fulfillment',
    );
  });

  it('fail validate create: invalid weekly fulfillment', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const singleMenuItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleMenuItem) {
      throw new Error('single menu item not found');
    }
    if (!singleMenuItem.sizes || singleMenuItem.sizes.length === 0) {
      throw new Error('single menu item sizes not found');
    }

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      isWeekly: true,
      weeklyFulfillment: 'invalid_day',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'weeklyFulfillment' }],
      'Invalid weeklyFulfillment value',
    );
  });

  it('fail validate create: duplicate ordered items', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const singleMenuItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleMenuItem) {
      throw new Error('single menu item not found');
    }
    if (!singleMenuItem.sizes || singleMenuItem.sizes.length === 0) {
      throw new Error('single menu item sizes not found');
    }

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        },
        {
          createId: 'c2',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 3,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'orderedItems' }],
      'duplicate order menu item',
    );
  });

  it('fail validate create: nested orderedItems validator errors: contained item not of type single', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }

    const anotherContainer = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!anotherContainer) {
      throw new Error('another container not found');
    }
    if (!anotherContainer.sizes || anotherContainer.sizes.length === 0) {
      throw new Error('another container sizes not found');
    }

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: anotherContainer.id,
              containedItemSizeId: anotherContainer.sizes[0].id,
              quantity: 2,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
        { prop: 'type' },
      ],
      'Only items of type single can be in a container',
    );
  });

  it('fail validate create: nested orderedItems validator errors: contained item size not valid', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes', 'containerMenuItems'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }
    if (
      !containerMenuItem.containerMenuItems ||
      containerMenuItem.containerMenuItems.length === 0
    ) {
      throw new Error('container menu items not found');
    }

    const containedItem =
      containerMenuItem.containerMenuItems[0].containedMenuItem;
    const allSizes = await sizeRepo.find();
    const invalidSize = allSizes.find(
      (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
    );
    if (!invalidSize) {
      throw new Error('invalid size not found');
    }
    const invalidSizeId = invalidSize.id;

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: invalidSizeId,
              quantity: 2,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
        { prop: 'containedItemSize' },
      ],
      'Invalid size',
    );
  });

  it('fail validate create: nested orderedItems validator errors: quantity with value 0', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const singleMenuItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleMenuItem) {
      throw new Error('single menu item not found');
    }
    if (!singleMenuItem.sizes || singleMenuItem.sizes.length === 0) {
      throw new Error('single menu item sizes not found');
    }

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 0,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'orderedItems', id: 'c1' }, { prop: 'quantity' }],
      'Invalid quantity',
    );
  });

  it('fail validate create: nested orderedItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes', 'containerMenuItems'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.variableMaxAmount) {
      throw new Error('container menu item does not have variableMaxAmount');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }
    if (
      !containerMenuItem.containerMenuItems ||
      containerMenuItem.containerMenuItems.length === 0
    ) {
      throw new Error('container menu items not found');
    }

    const containedItem =
      containerMenuItem.containerMenuItems[0].containedMenuItem;
    const containedItemSize =
      containerMenuItem.containerMenuItems[0].containedItemSize;

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: containerMenuItem.variableMaxAmount + 1,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'orderedItems', id: 'c1' }, { prop: 'quantity' }],
      'quantity must equal the variable max amount of the container',
    );
  });

  it('fail validate create: nested orderedItems validator errors: duplicate container item', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes', 'containerMenuItems'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }
    if (
      !containerMenuItem.containerMenuItems ||
      containerMenuItem.containerMenuItems.length === 0
    ) {
      throw new Error('container menu items not found');
    }

    const containedItem =
      containerMenuItem.containerMenuItems[0].containedMenuItem;
    const containedItemSize =
      containerMenuItem.containerMenuItems[0].containedItemSize;

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 2,
            },
            {
              createId: 'c3',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 3,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'orderedItems', id: 'c1' }, { prop: 'containerOrderMenuItems' }],
      'duplicate container item',
    );
  });

  it('fail validate create: nested orderedItems validator errors: nested orderContainerItem validator errors: contained item not of type single', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }

    const anotherContainer = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!anotherContainer) {
      throw new Error('another container not found');
    }
    if (!anotherContainer.sizes || anotherContainer.sizes.length === 0) {
      throw new Error('another container sizes not found');
    }

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: anotherContainer.id,
              containedItemSizeId: anotherContainer.sizes[0].id,
              quantity: 2,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
        { prop: 'type' },
      ],
      'Only items of type single can be in a container',
    );
  });

  it('fail validate create: nested orderedItems validator errors: nested orderContainerItem validator errors: contained item size not valid', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes', 'containerMenuItems'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }
    if (
      !containerMenuItem.containerMenuItems ||
      containerMenuItem.containerMenuItems.length === 0
    ) {
      throw new Error('container menu items not found');
    }

    const containedItem =
      containerMenuItem.containerMenuItems[0].containedMenuItem;
    const allSizes = await sizeRepo.find();
    const invalidSize = allSizes.find(
      (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
    );
    if (!invalidSize) {
      throw new Error('invalid size not found');
    }
    const invalidSizeId = invalidSize.id;

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: invalidSizeId,
              quantity: 2,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
        { prop: 'containedItemSize' },
      ],
      'Invalid size',
    );
  });

  it('fail validate create: nested orderedItems validator errors: nested orderContainerItem validator errors: quantity with value 0', async () => {
    const category = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!category) {
      throw new Error('category not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes', 'containerMenuItems'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }
    if (
      !containerMenuItem.containerMenuItems ||
      containerMenuItem.containerMenuItems.length === 0
    ) {
      throw new Error('container menu items not found');
    }

    const containedItem =
      containerMenuItem.containerMenuItems[0].containedMenuItem;
    const containedItemSize =
      containerMenuItem.containerMenuItems[0].containedItemSize;

    const dto: CreateOrderDto = {
      recipient: 'John Doe',
      fulfillmentDate: new Date(),
      fulfillmentType: 'pickup',
      categoryId: category.id,
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 0,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
        { prop: 'quantity' },
      ],
      'quantity must be greater than 0',
    );
  });

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {
    const orderToUpdate = await orderRepo.findOne({
      relations: ['orderedItems'],
    });
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const singleMenuItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleMenuItem) {
      throw new Error('single menu item not found');
    }
    if (!singleMenuItem.sizes || singleMenuItem.sizes.length === 0) {
      throw new Error('single menu item sizes not found');
    }
    const newCategory = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!newCategory) {
      throw new Error('new category not found');
    }

    const dto: UpdateOrderDto = {
      recipient: 'Updated Recipient',
      fulfillmentDate: new Date(),
      fulfillmentType: 'delivery',
      deliveryAddress: '123 Main St',
      phoneNumber: '1234567890',
      categoryId: newCategory.id,
      isWeekly: true,
      weeklyFulfillment: 'monday',
      note: 'Updated Note',
      orderedItems:
        orderToUpdate.orderedItems && orderToUpdate.orderedItems.length > 0
          ? [
              {
                id: orderToUpdate.orderedItems[0].id,
                quantity: 5,
              },
              {
                createId: 'c1',
                menuItemId: singleMenuItem.id,
                sizeId: singleMenuItem.sizes[0].id,
                quantity: 3,
              },
            ]
          : [
              {
                createId: 'c1',
                menuItemId: singleMenuItem.id,
                sizeId: singleMenuItem.sizes[0].id,
                quantity: 3,
              },
            ],
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expect(errors).toBeNull();
  });

  it('fail validate update: invalid fulfillment type', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const dto: UpdateOrderDto = {
      fulfillmentType: 'invalid_type',
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'fulfillmentType' }],
      'Invalid fulfillmentType value',
    );
  });

  it('fail validate update: order for delivery must have a delivery address', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const dto: UpdateOrderDto = {
      fulfillmentType: 'delivery',
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'deliveryAddress' }],
      'Order for delivery must have a delivery address',
    );
  });

  it('fail validate update: order for delivery must have a phone number', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const dto: UpdateOrderDto = {
      fulfillmentType: 'delivery',
      deliveryAddress: '123 Main St',
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'phoneNumber' }],
      'Order for delivery must have a delivery address',
    );
  });

  it('fail validate update: order must have a day of the week selected for fulfillment', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const dto: UpdateOrderDto = {
      isWeekly: true,
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'weeklyFulfillment' }],
      'Order must have a day of the week selected for fulfillment',
    );
  });

  it('fail validate update: invalid weekly fulfillment', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const dto: UpdateOrderDto = {
      weeklyFulfillment: 'invalid_day',
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'weeklyFulfillment' }],
      'Invalid weeklyFulfillment value',
    );
  });

  it('fail validate update: duplicate ordered items', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const singleMenuItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleMenuItem) {
      throw new Error('single menu item not found');
    }
    if (!singleMenuItem.sizes || singleMenuItem.sizes.length === 0) {
      throw new Error('single menu item sizes not found');
    }

    const dto: UpdateOrderDto = {
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 2,
        },
        {
          createId: 'c2',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 3,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'orderedItems' }],
      'duplicate order menu item',
    );
  });

  it('fail validate update: nested orderedItems validator errors: contained item not of type single', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }

    const anotherContainer = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!anotherContainer) {
      throw new Error('another container not found');
    }
    if (!anotherContainer.sizes || anotherContainer.sizes.length === 0) {
      throw new Error('another container sizes not found');
    }

    const dto: UpdateOrderDto = {
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: anotherContainer.id,
              containedItemSizeId: anotherContainer.sizes[0].id,
              quantity: 2,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
        { prop: 'containedMenuItem' },
      ],
      'contained item must be of type single',
    );
  });

  it('fail validate update: nested orderedItems validator errors: contained item size not valid', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes', 'containerMenuItems'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }
    if (
      !containerMenuItem.containerMenuItems ||
      containerMenuItem.containerMenuItems.length === 0
    ) {
      throw new Error('container menu items not found');
    }

    const containedItem =
      containerMenuItem.containerMenuItems[0].containedMenuItem;
    const allSizes = await sizeRepo.find();

    const invalidSize = allSizes.find(
      (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
    );
    if (!invalidSize) {
      throw new Error('invalid size not found');
    }

    const dto: UpdateOrderDto = {
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: invalidSize.id,
              quantity: 2,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
        { prop: 'containedItemSize' },
      ],
      'Invalid size',
    );
  });

  it('fail validate update: nested orderedItems validator errors: quantity with value 0', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const singleMenuItem = await menuItemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleMenuItem) {
      throw new Error('single menu item not found');
    }
    if (!singleMenuItem.sizes || singleMenuItem.sizes.length === 0) {
      throw new Error('single menu item sizes not found');
    }

    const dto: UpdateOrderDto = {
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: singleMenuItem.id,
          sizeId: singleMenuItem.sizes[0].id,
          quantity: 0,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'orderedItems', id: 'c1' }, { prop: 'quantity' }],
      'Invalid quantity',
    );
  });

  it('fail validate update: nested orderedItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes', 'containerMenuItems'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.variableMaxAmount) {
      throw new Error('container menu item does not have variableMaxAmount');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }
    if (
      !containerMenuItem.containerMenuItems ||
      containerMenuItem.containerMenuItems.length === 0
    ) {
      throw new Error('container menu items not found');
    }

    const containedItem =
      containerMenuItem.containerMenuItems[0].containedMenuItem;
    const containedItemSize =
      containerMenuItem.containerMenuItems[0].containedItemSize;

    const dto: UpdateOrderDto = {
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: containerMenuItem.variableMaxAmount + 1,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'orderedItems', id: 'c1' }, { prop: 'quantity' }],
      'quantity must equal the variable max amount of the container',
    );
  });

  it('fail validate update: nested orderedItems validator errors: duplicate container item', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes', 'containerMenuItems'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }
    if (
      !containerMenuItem.containerMenuItems ||
      containerMenuItem.containerMenuItems.length === 0
    ) {
      throw new Error('container menu items not found');
    }

    const containedItem =
      containerMenuItem.containerMenuItems[0].containedMenuItem;
    const containedItemSize =
      containerMenuItem.containerMenuItems[0].containedItemSize;

    const dto: UpdateOrderDto = {
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 2,
            },
            {
              createId: 'c3',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 3,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
      ],
      'duplicate container item',
    );
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c3' },
      ],
      'duplicate container item',
    );
  });

  it('fail validate update: nested orderedItems validator errors: nested orderContainerItem validator errors: contained item not of type single', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }

    const anotherContainer = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!anotherContainer) {
      throw new Error('another container not found');
    }
    if (!anotherContainer.sizes || anotherContainer.sizes.length === 0) {
      throw new Error('another container sizes not found');
    }

    const dto: UpdateOrderDto = {
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: anotherContainer.id,
              containedItemSizeId: anotherContainer.sizes[0].id,
              quantity: 2,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
        { prop: 'containedMenuItem' },
      ],
      'contained item must be of type single',
    );
  });

  it('fail validate update: nested orderedItems validator errors: nested orderContainerItem validator errors: contained item size not valid', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes', 'containerMenuItems'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }
    if (
      !containerMenuItem.containerMenuItems ||
      containerMenuItem.containerMenuItems.length === 0
    ) {
      throw new Error('container menu items not found');
    }

    const containedItem =
      containerMenuItem.containerMenuItems[0].containedMenuItem;
    const allSizes = await sizeRepo.find();

    const invalidSize = allSizes.find(
      (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
    );
    if (!invalidSize) {
      throw new Error('invalid size not found');
    }

    const dto: UpdateOrderDto = {
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: invalidSize.id,
              quantity: 2,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
        { prop: 'containedItemSize' },
      ],
      'Invalid size',
    );
  });

  it('fail validate update: nested orderedItems validator errors: nested orderContainerItem validator errors: quantity with value 0', async () => {
    const orderToUpdate = await orderRepo.findOne({});
    if (!orderToUpdate) {
      throw new Error('order not found');
    }

    const containerMenuItem = await menuItemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes', 'containerMenuItems'],
    });
    if (!containerMenuItem) {
      throw new Error('container menu item not found');
    }
    if (!containerMenuItem.sizes || containerMenuItem.sizes.length === 0) {
      throw new Error('container menu item sizes not found');
    }
    if (
      !containerMenuItem.containerMenuItems ||
      containerMenuItem.containerMenuItems.length === 0
    ) {
      throw new Error('container menu items not found');
    }

    const containedItem =
      containerMenuItem.containerMenuItems[0].containedMenuItem;
    const containedItemSize =
      containerMenuItem.containerMenuItems[0].containedItemSize;

    const dto: UpdateOrderDto = {
      orderedItems: [
        {
          createId: 'c1',
          menuItemId: containerMenuItem.id,
          sizeId: containerMenuItem.sizes[0].id,
          quantity: 1,
          containerOrderMenuItems: [
            {
              createId: 'c2',
              containedMenuItemId: containedItem.id,
              containedItemSizeId: containedItemSize.id,
              quantity: 0,
            },
          ],
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, orderToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'orderedItems', id: 'c1' },
        { prop: 'containerOrderMenuItems', id: 'c2' },
        { prop: 'quantity' },
      ],
      'quantity must be greater than 0',
    );
  });
});
