import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-update-menu-item-container-item.dto';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { item_a, item_b, item_container_a, item_container_b, item_var_max_container_c, item_var_max_container_d } from '../utils/constants';
import { menuItemToUpdateDto } from '../utils/entity-transformers/menu-item.dto.transfomer';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemValidator } from './menu-item.validator';

describe('menu item validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let validator: MenuItemValidator;

    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;

    let findCategory = async () => {
        return await categoryRepo.findOneOrFail({ where: {} });
    };

    let findMenuItem = async (name: string) => {
        return await itemRepo.findOneOrFail({ where: { name }, relations: ['sizes', 'containerMenuItems', 'category', 'containerMenuItems.containedMenuItem', 'containerMenuItems.containedItemSize'] });
    };

    let findSize = async (name: string) => {
        return await sizeRepo.findOneOrFail({ where: { name } });
    };

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

        validator = module.get<MenuItemValidator>(MenuItemValidator);

        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
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
        const category = await findCategory();

        const sizes = await sizeRepo.find();
        if (sizes.length < 2) {
            throw new Error('not enough sizes for test');
        }
        const containedItem1 = await findMenuItem(item_a);
        const containedItem2 = await findMenuItem(item_b);

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: 'New Container Item',
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: category.id,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem1.id,
                    containedItemSizeId: containedItem1.sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: sizes[0].id,
                }),
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: containedItem2.id,
                    containedItemSizeId: containedItem2.sizes[0].id,
                    quantity: 3,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length === 0) {
            throw new Error('sizes not found');
        }

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: item_a,
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: null,
            sizeIds: [sizes[0].id],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate create: containerMenuItems and not set to type container', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length === 0) {
            throw new Error('sizes not found');
        }
        const containedItem = await findMenuItem(item_a);

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: 'New Item',
            type: MENU_ITEM_TYPES.SINGLE,
            sizeIds: sizes.map((s) => s.id),
            categoryId: null,
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['type']),
        );
    });

    it('fail validate create: containerMenuItems errors: duplicate container item', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length === 0) {
            throw new Error('sizes not found');
        }
        const containedItem = await findMenuItem(item_a);

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: 'New Container Item',
            type: MENU_ITEM_TYPES.CONTAINER,
            sizeIds: sizes.map((s) => s.id),
            categoryId: null,
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: sizes[0].id,
                }),
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 3,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['containerMenuItems']),
        );
    });

    it('fail validate create: nested containerMenuItems validator errors: contained item not of type single', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length === 0) {
            throw new Error('sizes not found');
        }

        const containerItem = await itemRepo.findOne({
            where: { type: MENU_ITEM_TYPES.CONTAINER },
            relations: ['sizes'],
        });
        if (!containerItem) {
            throw new Error('container item not found');
        }
        if (!containerItem.sizes || containerItem.sizes.length === 0) {
            throw new Error('container item sizes not found');
        }

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: 'New Container Item',
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: null,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containerItem.id,
                    containedItemSizeId: containerItem.sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' },],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['type']),
        );
    });

    it('fail validate create: nested containerMenuItems validator errors: contained item size not valid', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length === 0) {
            throw new Error('sizes not found');
        }
        const containedItem = await findMenuItem(item_a);

        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: 'New Container Item',
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: null,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate create: nested containerMenuItems validator errors: quantity with value 0', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length === 0) {
            throw new Error('sizes not found');
        }
        const containedItem = await findMenuItem(item_a);

        const dto: CreateMenuItemDto = plainToInstance(CreateMenuItemDto, {
            name: 'New Container Item',
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: null,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 0,
                    parentItemSizeId: sizes[0].id,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    // Update Validation Tests
    it('successfully validate update with no validation errors', async () => {
        const itemToUpdate = await findMenuItem(item_var_max_container_d);
        if (!itemToUpdate.containerMenuItems) {
            throw new Error('item container menu items not found');
        }
        const containedItem = await findMenuItem(item_a);
        const newCategory = await findCategory();

        const dto: UpdateMenuItemDto = plainToInstance(UpdateMenuItemDto, {
            name: 'Updated Item Name',
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: newCategory.id,
            variableMaxAmount: 6,
            sizeIds: itemToUpdate.sizes.map((s) => s.id),
            containerMenuItems:
                [
                    plainToInstance(NestedUpdateMenuItemContainerItemDto, {
                        id: itemToUpdate.containerMenuItems[0].id,
                        quantity: 6,
                        containedMenuItemId: itemToUpdate.containerMenuItems[0].containedMenuItem.id,
                        containedItemSizeId: itemToUpdate.containerMenuItems[0].containedItemSize.id,
                    }),
                    plainToInstance(NestedCreateMenuItemContainerItemDto, {
                        createId: 'c1',
                        containedMenuItemId: containedItem.id,
                        containedItemSizeId: containedItem.sizes[0].id,
                        quantity: 6,
                        parentItemSizeId: itemToUpdate.sizes[0].id,
                    }),
                ]
        });

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const items = await itemRepo.find({
            relations: [
                'category',
                'sizes',
                'containerMenuItems',
                'containerMenuItems.containedMenuItem',
                'containerMenuItems.containedItemSize',
            ],
        });
        if (items.length < 2) {
            throw new Error('Not enough items for test');
        }

        const itemToUpdate = items[0];
        if (!itemToUpdate.category || !itemToUpdate.sizes || !itemToUpdate.containerMenuItems) {
            throw new Error('item not found');
        }
        const existingItem = items[1];

        const dto = menuItemToUpdateDto(itemToUpdate, { name: existingItem.name });

        /*const dto: UpdateMenuItemDto = plainToInstance(UpdateMenuItemDto, {
            name: existingItem.name,
            type: itemToUpdate.type,
            categoryId: itemToUpdate.category?.id,
            sizeIds: itemToUpdate.sizes.map((s) => s.id),
            containerMenuItems: itemToUpdate.containerMenuItems.map((c) => plainToInstance(NestedUpdateMenuItemContainerItemDto, {
                id: c.id,
                quantity: c.quantity,
                containedMenuItemId: c.containedMenuItem.id,
                containedItemSizeId: c.containedItemSize.id,
            })),
            variableMaxAmount: itemToUpdate.variableMaxAmount,
        });*/

        const errors = await validator.validateDto(dto, itemToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate update: containerMenuItems and not set to type container', async () => {
        const singleItem = await itemRepo.findOneOrFail({
            where: { type: MENU_ITEM_TYPES.SINGLE },
            relations: ['category', 'sizes'],
        });
        if (!singleItem.category || !singleItem.sizes) {
            throw new Error('single item not found');
        }

        const containedItem = await findMenuItem(item_a);

        const dto = menuItemToUpdateDto(singleItem, {
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: singleItem.sizes[0].id,
                }),
            ],
        });

        /*const dto: UpdateMenuItemDto = plainToInstance(UpdateMenuItemDto, {
            name: singleItem.name,
            type: singleItem.type,
            categoryId: singleItem.category.id,
            sizeIds: singleItem.sizes.map((s) => s.id),
            variableMaxAmount: singleItem.variableMaxAmount,
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: singleItem.sizes[0].id,
                }),
            ],
        });*/

        const errors = await validator.validateDto(dto, singleItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['type']),
        );
    });

    it('fail validate update: containerMenuItems errors: duplicate container item', async () => {
        const containerItem = await findMenuItem(item_container_a);
        if (!containerItem.category) {
            throw new Error('container item category not found');
        }
        const containedItem = await findMenuItem(item_a);

        const dto = menuItemToUpdateDto(containerItem, {
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 3,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });

        /*const dto: UpdateMenuItemDto = plainToInstance(UpdateMenuItemDto, {
            name: containerItem.name,
            type: containerItem.type,
            categoryId: containerItem.category?.id,
            sizeIds: containerItem.sizes.map((s) => s.id),
            variableMaxAmount: containerItem.variableMaxAmount,
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 3,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });*/

        const errors = await validator.validateDto(dto, containerItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['containerMenuItems']),
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: contained item not of type single', async () => {
        const containerItem = await findMenuItem(item_container_b);
        if (!containerItem.category) {
            throw new Error('container item category not found');
        }
        const anotherContainer = await findMenuItem(item_container_a);

        const dto = menuItemToUpdateDto(containerItem, {
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: anotherContainer.id,
                    containedItemSizeId: anotherContainer.sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });

        /*const dto: UpdateMenuItemDto = plainToInstance(UpdateMenuItemDto, {
            name: containerItem.name,
            type: containerItem.type,
            categoryId: containerItem.category?.id,
            sizeIds: containerItem.sizes.map((s) => s.id),
            variableMaxAmount: containerItem.variableMaxAmount,
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: anotherContainer.id,
                    containedItemSizeId: anotherContainer.sizes[0].id,
                    quantity: 2,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });*/

        const errors = await validator.validateDto(dto, containerItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['type']),
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: contained item size not valid', async () => {
        const containerItem = await findMenuItem(item_container_a);
        if (!containerItem.category) {
            throw new Error('container item category not found');
        }
        if (!containerItem.containerMenuItems) {
            throw new Error('container item container menu items not found');
        }

        const containedItem = await findMenuItem(item_a);

        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }
        const dto = menuItemToUpdateDto(containerItem, {
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });

        /*const dto: UpdateMenuItemDto = plainToInstance(UpdateMenuItemDto, {
        const dto: UpdateMenuItemDto = plainToInstance(UpdateMenuItemDto, {
            name: containerItem.name,
            type: containerItem.type,
            categoryId: containerItem.category?.id,
            sizeIds: containerItem.sizes.map((s) => s.id),
            variableMaxAmount: containerItem.variableMaxAmount,
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });*/

        const errors = await validator.validateDto(dto, containerItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']),
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: quantity with value 0', async () => {
        const containerItem = await findMenuItem(item_container_a);
        if (!containerItem.category) {
            throw new Error('container item category not found');
        }
        if (!containerItem.containerMenuItems) {
            throw new Error('container item container menu items not found');
        }
        const containedItem = await findMenuItem(item_a);

        const dto = menuItemToUpdateDto(containerItem, {
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 0,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });

        /*const dto: UpdateMenuItemDto = plainToInstance(UpdateMenuItemDto, {
        const dto: UpdateMenuItemDto = plainToInstance(UpdateMenuItemDto, {
            name: containerItem.name,
            type: containerItem.type,
            categoryId: containerItem.category?.id,
            sizeIds: containerItem.sizes.map((s) => s.id),
            variableMaxAmount: containerItem.variableMaxAmount,
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 0,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });*/

        const errors = await validator.validateDto(dto, containerItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
        const containerItem = await findMenuItem(item_var_max_container_c);
        if (!containerItem.category) {
            throw new Error('container item category not found');
        }
        if (!containerItem.variableMaxAmount) {
            throw new Error('container item variable max amount not found');
        }

        const containedItem = await findMenuItem(item_a);

        const dto = menuItemToUpdateDto(containerItem, {
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: containerItem.variableMaxAmount + 1,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });

        /*const dto: UpdateMenuItemDto = plainToInstance(UpdateMenuItemDto, {
            name: containerItem.name,
            type: containerItem.type,
            categoryId: containerItem.category?.id,
            sizeIds: containerItem.sizes.map((s) => s.id),
            variableMaxAmount: containerItem.variableMaxAmount,
            containerMenuItems: [
                plainToInstance(NestedCreateMenuItemContainerItemDto, {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: containerItem.variableMaxAmount + 1,
                    parentItemSizeId: containerItem.sizes[0].id,
                }),
            ],
        });*/

        const errors = await validator.validateDto(dto, containerItem.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });
});
