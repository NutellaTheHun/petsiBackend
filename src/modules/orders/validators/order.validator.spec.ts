import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_a, item_b, item_container_a, item_container_b, item_f, item_var_max_container_c } from '../../menu-items/utils/constants';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../dto/order-menu-item/nested-update-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { NestedCreateRecurringOrderScheduleDto } from '../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { TYPE_A } from '../utils/constants';
import { orderToUpdateDto } from '../utils/entity-transformers/order.dto.transformer';
import { OCCURRENCE_TYPES } from '../utils/occurence-types';
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
    let menuItemContainerItemRepo: Repository<MenuItemContainerItem>;

    const findCategory = async (name: string) => {
        return await categoryRepo.findOneOrFail({ where: { name } });
    }

    const findMenuItem = async (name: string) => {
        return await menuItemRepo.findOneOrFail({ where: { name }, relations: ['sizes', 'containerMenuItems', 'containerMenuItems.containedMenuItem', 'containerMenuItems.containedItemSize', 'containerMenuItems.containedMenuItem.sizes'] });
    }

    const findOrder = async () => {
        return await orderRepo.findOneOrFail({ where: {}, relations: ['orderedItems', 'orderedItems.menuItem', 'orderedItems.size', 'category', 'orderedItems.containerOrderMenuItems', 'orderedItems.containerOrderMenuItems.containedMenuItem', 'orderedItems.containerOrderMenuItems.containedItemSize'] });
    }

    const getValidContainerMenuItems = async (parentId: number, parentSizeId: number) => {
        return await menuItemContainerItemRepo.find({ where: { parentMenuItem: { id: parentId }, parentItemSize: { id: parentSizeId } }, relations: ['containedMenuItem', 'containedItemSize', 'containedMenuItem.sizes'] });
    }

    const getNonDuplicateMenuItems = async (order: Order, numberOfItems: number, itemType: string = MENU_ITEM_TYPES.SINGLE) => {
        const validItemSizeCombinations: { itemId: number, sizeId: number }[] = [];
        let count = 0;
        const currentOrderItems = new Set<string>(
            order.orderedItems.map(item => `${item.menuItem.id}:${item.size?.id}`),
        )
        const allMenuItems = await menuItemRepo.find({ where: { type: itemType }, relations: ['sizes'] });
        for (const item of allMenuItems) {
            for (const size of item.sizes) {
                const combination = `${item.id}:${size.id}`;
                if (!currentOrderItems.has(combination)) {
                    validItemSizeCombinations.push({ itemId: item.id, sizeId: size.id });
                    count++;
                    if (count >= numberOfItems) {
                        return validItemSizeCombinations;
                    }
                }
            }
        }

        return validItemSizeCombinations;
    }


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
        menuItemContainerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const category = await findCategory(TYPE_A);
        const singleMenuItem = await findMenuItem(item_a);
        const anotherMenuItem = await findMenuItem(item_b);
        const containerMenuItem = await findMenuItem(item_container_a);

        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerMenuItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
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
                    sizeId: containerMenuItem.sizes[0].id,
                    quantity: 1,
                    containerOrderMenuItems: [
                        plainToInstance(NestedCreateOrderContainerItemDto, {
                            createId: 'c5',
                            containedMenuItemId: containedItem.id,
                            containedItemSizeId: containedItemSize.id,
                            quantity: 2,
                            parentMenuItemIdCtx: containerMenuItem.id,
                            parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                        }),
                        plainToInstance(NestedCreateOrderContainerItemDto, {
                            createId: 'c6',
                            containedMenuItemId: containedItem2.id,
                            containedItemSizeId: containedItemSize2.id,
                            quantity: 3,
                            parentMenuItemIdCtx: containerMenuItem.id,
                            parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                        }),
                    ],
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: invalid fulfillment type', async () => {
        const category = await findCategory(TYPE_A);
        const singleMenuItem = await findMenuItem(item_a);

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
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['fulfillmentType']),
        );
    });

    it('fail validate create: order for delivery must have a delivery address', async () => {
        const category = await findCategory(TYPE_A);
        const singleMenuItem = await findMenuItem(item_a);

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
            createValidationErrorPayload('MISSING_PROPERTY', undefined, ['deliveryAddress']),
        );
    });

    it('fail validate create: order for delivery must have a phone number', async () => {
        const category = await findCategory(TYPE_A);
        const singleMenuItem = await findMenuItem(item_a);

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
            createValidationErrorPayload('MISSING_PROPERTY', undefined, ['phoneNumber']),
        );
    });

    it('fail validate create: duplicate ordered items', async () => {
        const category = await findCategory(TYPE_A);
        const singleMenuItem = await findMenuItem(item_a);

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
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['orderedItems']),
        );
    });

    // Validate Create: Invalid contained item

    it('fail validate create: nested orderedItems validator errors: contained item size not valid', async () => {
        const category = await findCategory(TYPE_A);
        const containerMenuItem = await findMenuItem(item_container_b);
        if (!containerMenuItem.containerMenuItems) {
            throw new Error('container menu item container menu items not found');
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

        const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
            recipient: 'John Doe',
            fulfillmentDate: new Date(),
            fulfillmentType: 'pickup',
            categoryId: category.id,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'c1',
                    menuItemId: containerMenuItem.id,
                    sizeId: containerMenuItem.sizes[0].id,
                    quantity: 1,
                    containerOrderMenuItems: [
                        plainToInstance(NestedCreateOrderContainerItemDto, {
                            createId: 'c2',
                            containedMenuItemId: containedItem.id,
                            containedItemSizeId: invalidSizeId,
                            quantity: 2,
                            parentMenuItemIdCtx: containerMenuItem.id,
                            parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
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
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate create: nested orderedItems validator errors: quantity with value 0', async () => {
        const category = await findCategory(TYPE_A);
        const singleMenuItem = await findMenuItem(item_a);

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
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate create: nested orderedItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
        const category = await findCategory(TYPE_A);
        const containerMenuItem = await findMenuItem(item_var_max_container_c);
        if (!containerMenuItem.variableMaxAmount) {
            throw new Error('container menu item does not have variableMaxAmount');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerMenuItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }

        const containedItem = validContainerMenuItems[0].containedMenuItem;
        const containedItemSize = validContainerMenuItems[0].containedItemSize;

        const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
            recipient: 'John Doe',
            fulfillmentDate: new Date(),
            fulfillmentType: 'pickup',
            categoryId: category.id,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'c1',
                    menuItemId: containerMenuItem.id,
                    sizeId: containerMenuItem.sizes[0].id,
                    quantity: 1,
                    containerOrderMenuItems: [
                        plainToInstance(NestedCreateOrderContainerItemDto, {
                            createId: 'c2',
                            containedMenuItemId: containedItem.id,
                            containedItemSizeId: containedItemSize.id,
                            quantity: containerMenuItem.variableMaxAmount + 1,
                            parentMenuItemIdCtx: containerMenuItem.id,
                            parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
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
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containerOrderMenuItems']),
        );
    });

    it('fail validate create: nested orderedItems validator errors: duplicate container item', async () => {
        const category = await findCategory(TYPE_A);
        const containerMenuItem = await findMenuItem(item_container_a);
        if (!containerMenuItem.containerMenuItems) {
            throw new Error('container menu item container menu items not found');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerMenuItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }

        const containedItem = validContainerMenuItems[0].containedMenuItem;
        const containedItemSize = validContainerMenuItems[0].containedItemSize;

        const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
            recipient: 'John Doe',
            fulfillmentDate: new Date(),
            fulfillmentType: 'pickup',
            categoryId: category.id,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'c1',
                    menuItemId: containerMenuItem.id,
                    sizeId: containerMenuItem.sizes[0].id,
                    quantity: 1,
                    containerOrderMenuItems: [
                        plainToInstance(NestedCreateOrderContainerItemDto, {
                            createId: 'c2',
                            containedMenuItemId: containedItem.id,
                            containedItemSizeId: containedItemSize.id,
                            quantity: 2,
                            parentMenuItemIdCtx: containerMenuItem.id,
                            parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                        }),
                        plainToInstance(NestedCreateOrderContainerItemDto, {
                            createId: 'c3',
                            containedMenuItemId: containedItem.id,
                            containedItemSizeId: containedItemSize.id,
                            quantity: 3,
                            parentMenuItemIdCtx: containerMenuItem.id,
                            parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
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
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c2', 'c3'], ['containerOrderMenuItems']),
        );
    });

    it('fail validate create: nested orderedItems validator errors: nested orderContainerItem validator errors: quantity with value 0', async () => {
        const category = await findCategory(TYPE_A);
        const containerMenuItem = await findMenuItem(item_container_a);
        if (!containerMenuItem.containerMenuItems) {
            throw new Error('container menu item container menu items not found');
        }

        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerMenuItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }

        const containedItem = validContainerMenuItems[0].containedMenuItem;
        const containedItemSize = validContainerMenuItems[0].containedItemSize;

        const dto: CreateOrderDto = plainToInstance(CreateOrderDto, {
            recipient: 'John Doe',
            fulfillmentDate: new Date(),
            fulfillmentType: 'pickup',
            categoryId: category.id,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'c1',
                    menuItemId: containerMenuItem.id,
                    sizeId: containerMenuItem.sizes[0].id,
                    quantity: 1,
                    containerOrderMenuItems: [
                        plainToInstance(NestedCreateOrderContainerItemDto, {
                            createId: 'c2',
                            containedMenuItemId: containedItem.id,
                            containedItemSizeId: containedItemSize.id,
                            quantity: 0,
                            parentMenuItemIdCtx: containerMenuItem.id,
                            parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
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
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    // Validate Create: Invalid recurrence schedule
    it('fail validate create: invalid recurrence schedule, frequency is invalid', async () => {
        const category = await findCategory(TYPE_A);
        const singleMenuItem = await findMenuItem(item_a);
        const anotherMenuItem = await findMenuItem(item_b);

        const recurrenceSchedule = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'INVALID',
            interval: 1,
            daysOfWeek: [6],
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        });

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
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['frequency']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const orderToUpdate = await findOrder();
        if (!orderToUpdate) {
            throw new Error('order not found');
        }

        const singleMenuItem = await findMenuItem(item_f);
        const newCategory = await findCategory(TYPE_A);

        const containerMenuItem = await findMenuItem(item_container_b);
        if (!containerMenuItem.containerMenuItems) {
            throw new Error('container menu item container menu items not found');
        }
        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerMenuItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
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
            orderedItems:
                [
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
                        sizeId: containerMenuItem.sizes[0].id,
                        quantity: 1,
                        containerOrderMenuItems: [
                            plainToInstance(NestedCreateOrderContainerItemDto, {
                                createId: 'c3',
                                containedMenuItemId: containedItem.id,
                                containedItemSizeId: containedItemSize.id,
                                quantity: 2,
                                parentMenuItemIdCtx: containerMenuItem.id,
                                parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                            }),
                            plainToInstance(NestedCreateOrderContainerItemDto, {
                                createId: 'c4',
                                containedMenuItemId: containedItem2.id,
                                containedItemSizeId: containedItemSize2.id,
                                quantity: 3,
                                parentMenuItemIdCtx: containerMenuItem.id,
                                parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                            }),
                        ],
                    }),
                ]
        });

        const errors = await validator.validateDto(dto, orderToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: invalid fulfillment type', async () => {
        const orderToUpdate = await findOrder();
        if (!orderToUpdate?.category) {
            throw new Error('order category not found');
        }

        const dto = orderToUpdateDto(orderToUpdate, { fulfillmentType: 'invalid_type' });

        const errors = await validator.validateDto(dto, orderToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['fulfillmentType']),
        );
    });

    it('fail validate update: order for delivery must have a delivery address', async () => {
        const orderToUpdate = await findOrder();
        if (!orderToUpdate?.category) {
            throw new Error('order category not found');
        }

        const dto = orderToUpdateDto(orderToUpdate, { fulfillmentType: 'delivery', phoneNumber: '1234567890', deliveryAddress: null });

        const errors = await validator.validateDto(dto, orderToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('MISSING_PROPERTY', undefined, ['deliveryAddress']),
        );
    });

    it('fail validate update: order for delivery must have a phone number', async () => {
        const orderToUpdate = await findOrder();
        if (!orderToUpdate?.category) {
            throw new Error('order category not found');
        }

        const dto = orderToUpdateDto(orderToUpdate, { fulfillmentType: 'delivery', deliveryAddress: '123 Main St', phoneNumber: null });

        const errors = await validator.validateDto(dto, orderToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('MISSING_PROPERTY', undefined, ['phoneNumber']),
        );
    });

    it('fail validate update: duplicate ordered items', async () => {
        const orderToUpdate = await findOrder();
        if (!orderToUpdate?.category) {
            throw new Error('order category not found');
        }

        const duplicateItem = orderToUpdate.orderedItems[0];

        const dto = orderToUpdateDto(orderToUpdate, {
            orderedItems: [{
                createId: 'c1',
                menuItemId: duplicateItem.menuItem.id,
                sizeId: duplicateItem.size?.id ?? 0,
                quantity: duplicateItem.quantity,
                containerOrderMenuItems: []
            }]
        });

        const errors = await validator.validateDto(dto, orderToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', duplicateItem.id], ['orderedItems']),
        );
    });

    it('fail validate update: nested orderedItems validator errors: contained item size not valid', async () => {
        const orderToUpdate = await findOrder();
        const validContainerMenuItem = await getNonDuplicateMenuItems(orderToUpdate, 1, MENU_ITEM_TYPES.CONTAINER);
        const containerMenuItem = validContainerMenuItem[0];


        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.itemId, containerMenuItem.sizeId);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }

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
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate update: nested orderedItems validator errors: quantity with value 0', async () => {
        const orderToUpdate = await findOrder();
        const validMenuItem = await getNonDuplicateMenuItems(orderToUpdate, 1, MENU_ITEM_TYPES.SINGLE);
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
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate update: nested orderedItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
        const orderToUpdate = await findOrder();
        const containerMenuItem = await findMenuItem(item_var_max_container_c);
        if (!containerMenuItem.variableMaxAmount) {
            throw new Error('container menu item variable max amount not found');
        }
        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.id, containerMenuItem.sizes[0].id);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }


        const containedItem =
            validContainerMenuItems[0].containedMenuItem;
        const containedItemSize =
            validContainerMenuItems[0].containedItemSize;

        const dto = orderToUpdateDto(orderToUpdate, {
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'c1',
                    menuItemId: containerMenuItem.id,
                    sizeId: containerMenuItem.sizes[0].id,
                    quantity: 1,
                    containerOrderMenuItems: [
                        plainToInstance(NestedCreateOrderContainerItemDto, {
                            createId: 'c2',
                            containedMenuItemId: containedItem.id,
                            containedItemSizeId: containedItemSize.id,
                            quantity: containerMenuItem.variableMaxAmount + 1,
                            parentMenuItemIdCtx: containerMenuItem.id,
                            parentMenuItemSizeIdCtx: containerMenuItem.sizes[0].id,
                        }),
                    ],
                }),
            ]
        });

        const errors = await validator.validateDto(dto, orderToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'orderedItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containerOrderMenuItems']),
        );
    });

    it('fail validate update: nested orderedItems validator errors: duplicate container item', async () => {
        const orderToUpdate = await findOrder();
        const validContainerMenuItem = await getNonDuplicateMenuItems(orderToUpdate, 1, MENU_ITEM_TYPES.CONTAINER);
        const containerMenuItem = validContainerMenuItem[0];
        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.itemId, containerMenuItem.sizeId);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }

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
            ]
        });

        const errors = await validator.validateDto(dto, orderToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'orderedItems', id: 'c1' },
            ],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c2', 'c3'], ['containerOrderMenuItems']),
        );
    });

    it('fail validate update: nested orderedItems validator errors: nested orderContainerItem validator errors: contained item size not valid', async () => {
        const orderToUpdate = await findOrder();
        const validContainerMenuItem = await getNonDuplicateMenuItems(orderToUpdate, 1, MENU_ITEM_TYPES.CONTAINER);
        const containerMenuItem = validContainerMenuItem[0];
        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.itemId, containerMenuItem.sizeId);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }

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
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate update: nested orderedItems validator errors: nested orderContainerItem validator errors: quantity with value 0', async () => {
        const orderToUpdate = await findOrder();
        const validContainerMenuItem = await getNonDuplicateMenuItems(orderToUpdate, 1, MENU_ITEM_TYPES.CONTAINER);
        const containerMenuItem = validContainerMenuItem[0];
        const validContainerMenuItems = await getValidContainerMenuItems(containerMenuItem.itemId, containerMenuItem.sizeId);
        if (!validContainerMenuItems) {
            throw new Error('valid container menu items not found');
        }
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
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate update: invalid recurrence schedule, frequency is invalid', async () => {
        const orderToUpdate = await findOrder();
        const recurrenceSchedule = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'c1',
            frequency: 'INVALID',
            interval: 1,
            daysOfWeek: [6],
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        });

        const dto = orderToUpdateDto(orderToUpdate, {
            recurrenceSchedule: recurrenceSchedule,
            occurrenceType: OCCURRENCE_TYPES.TEMPLATE,
        });

        const errors = await validator.validateDto(dto, orderToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'recurrenceSchedule' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['frequency']),
        );
    });
});
