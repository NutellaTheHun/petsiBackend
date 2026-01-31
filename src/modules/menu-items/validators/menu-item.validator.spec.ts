import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { item_a, item_b, item_f, item_g } from '../utils/constants';
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
        const category = await categoryRepo.findOne({});
        if (!category) {
            throw new Error('category not found');
        }
        const sizes = await sizeRepo.find();
        if (sizes.length < 2) {
            throw new Error('not enough sizes for test');
        }
        const containedItem1 = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem1) {
            throw new Error('contained item 1 not found');
        }
        if (!containedItem1.sizes || containedItem1.sizes.length === 0) {
            throw new Error('contained item 1 sizes not found');
        }
        const containedItem2 = await itemRepo.findOne({
            where: { name: item_b },
            relations: ['sizes'],
        });
        if (!containedItem2) {
            throw new Error('contained item 2 not found');
        }
        if (!containedItem2.sizes || containedItem2.sizes.length === 0) {
            throw new Error('contained item 2 sizes not found');
        }

        const dto: CreateMenuItemDto = {
            name: 'New Container Item',
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: category.id,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem1.id,
                    containedItemSizeId: containedItem1.sizes[0].id,
                    quantity: 2,
                },
                {
                    createId: 'c2',
                    containedMenuItemId: containedItem2.id,
                    containedItemSizeId: containedItem2.sizes[0].id,
                    quantity: 3,
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length === 0) {
            throw new Error('sizes not found');
        }

        const dto: CreateMenuItemDto = {
            name: item_a,
            type: MENU_ITEM_TYPES.SINGLE,
            sizeIds: [sizes[0].id],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'name' }],
            'Menu item already exists.',
        );
    });

    it('fail validate create: containerMenuItems and not set to type container', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length === 0) {
            throw new Error('sizes not found');
        }
        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error('contained item not found');
        }
        if (!containedItem.sizes || containedItem.sizes.length === 0) {
            throw new Error('contained item sizes not found');
        }

        const dto: CreateMenuItemDto = {
            name: 'New Item',
            type: MENU_ITEM_TYPES.SINGLE,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 2,
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'type' }],
            'item has contained items but is not set to type container',
        );
    });

    it('fail validate create: containerMenuItems errors: duplicate container item', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length === 0) {
            throw new Error('sizes not found');
        }
        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error('contained item not found');
        }
        if (!containedItem.sizes || containedItem.sizes.length === 0) {
            throw new Error('contained item sizes not found');
        }

        const dto: CreateMenuItemDto = {
            name: 'New Container Item',
            type: MENU_ITEM_TYPES.CONTAINER,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 2,
                },
                {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 3,
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            'duplicate container item',
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c2' }],
            'duplicate container item',
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

        const dto: CreateMenuItemDto = {
            name: 'New Container Item',
            type: MENU_ITEM_TYPES.CONTAINER,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containerItem.id,
                    containedItemSizeId: containerItem.sizes[0].id,
                    quantity: 2,
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }, { prop: 'containedMenuItem' }],
            'contained item must be of type single',
        );
    });

    it('fail validate create: nested containerMenuItems validator errors: contained item size not valid', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length === 0) {
            throw new Error('sizes not found');
        }
        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error('contained item not found');
        }

        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: CreateMenuItemDto = {
            name: 'New Container Item',
            type: MENU_ITEM_TYPES.CONTAINER,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }, { prop: 'containedItemSize' }],
            'Invalid size',
        );
    });

    it('fail validate create: nested containerMenuItems validator errors: quantity with value 0', async () => {
        const sizes = await sizeRepo.find();
        if (sizes.length === 0) {
            throw new Error('sizes not found');
        }
        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error('contained item not found');
        }
        if (!containedItem.sizes || containedItem.sizes.length === 0) {
            throw new Error('contained item sizes not found');
        }

        const dto: CreateMenuItemDto = {
            name: 'New Container Item',
            type: MENU_ITEM_TYPES.CONTAINER,
            sizeIds: sizes.map((s) => s.id),
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 0,
                },
            ],
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }, { prop: 'quantity' }],
            'Invalid quantity',
        );
    });

    // Update Validation Tests
    it('successfully validate update with no validation errors', async () => {
        const itemToUpdate = await itemRepo.findOne({
            where: { name: item_f },
            relations: ['containerMenuItems'],
        });
        if (!itemToUpdate) {
            throw new Error('item not found');
        }

        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error('contained item not found');
        }
        if (!containedItem.sizes || containedItem.sizes.length === 0) {
            throw new Error('contained item sizes not found');
        }

        const newCategory = await categoryRepo.findOne({});
        if (!newCategory) {
            throw new Error('new category not found');
        }

        const dto: UpdateMenuItemDto = {
            name: 'Updated Item Name',
            type: MENU_ITEM_TYPES.CONTAINER,
            categoryId: newCategory.id,
            variableMaxAmount: 6,
            containerMenuItems:
                itemToUpdate.containerMenuItems &&
                    itemToUpdate.containerMenuItems.length > 0
                    ? [
                        {
                            id: itemToUpdate.containerMenuItems[0].id,
                            quantity: 6,
                        },
                        {
                            createId: 'c1',
                            containedMenuItemId: containedItem.id,
                            containedItemSizeId: containedItem.sizes[0].id,
                            quantity: 6,
                        },
                    ]
                    : [
                        {
                            createId: 'c1',
                            containedMenuItemId: containedItem.id,
                            containedItemSizeId: containedItem.sizes[0].id,
                            quantity: 6,
                        },
                    ],
        };

        const errors = await validator.validateUpdateNode(dto, itemToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const items = await itemRepo.find();
        if (items.length < 2) {
            throw new Error('Not enough items for test');
        }

        const itemToUpdate = items[0];
        const existingItem = items[1];

        const dto: UpdateMenuItemDto = {
            name: existingItem.name,
        };

        const errors = await validator.validateUpdateNode(dto, itemToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'name' }],
            'Menu item already exists.',
        );
    });

    it('fail validate update: containerMenuItems and not set to type container', async () => {
        const singleItem = await itemRepo.findOne({
            where: { type: MENU_ITEM_TYPES.SINGLE },
        });
        if (!singleItem) {
            throw new Error('single item not found');
        }

        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error('contained item not found');
        }
        if (!containedItem.sizes || containedItem.sizes.length === 0) {
            throw new Error('contained item sizes not found');
        }

        const dto: UpdateMenuItemDto = {
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 2,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(dto, singleItem.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'type' }],
            'item has contained items but is not set to type container',
        );
    });

    it('fail validate update: containerMenuItems errors: duplicate container item', async () => {
        const containerItem = await itemRepo.findOne({
            where: { name: item_f },
        });
        if (!containerItem) {
            throw new Error('container item not found');
        }

        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error('contained item not found');
        }
        if (!containedItem.sizes || containedItem.sizes.length === 0) {
            throw new Error('contained item sizes not found');
        }

        const dto: UpdateMenuItemDto = {
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 2,
                },
                {
                    createId: 'c2',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 3,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(dto, containerItem.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }],
            'duplicate container item',
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c2' }],
            'duplicate container item',
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: contained item not of type single', async () => {
        const containerItem = await itemRepo.findOne({
            where: { name: item_f },
        });
        if (!containerItem) {
            throw new Error('container item not found');
        }

        const anotherContainer = await itemRepo.findOne({
            where: { name: item_g },
            relations: ['sizes'],
        });
        if (!anotherContainer) {
            throw new Error('another container not found');
        }
        if (!anotherContainer.sizes || anotherContainer.sizes.length === 0) {
            throw new Error('another container sizes not found');
        }

        const dto: UpdateMenuItemDto = {
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: anotherContainer.id,
                    containedItemSizeId: anotherContainer.sizes[0].id,
                    quantity: 2,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(dto, containerItem.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }, { prop: 'containedMenuItem' }],
            'contained item must be of type single',
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: contained item size not valid', async () => {
        const containerItem = await itemRepo.findOne({
            where: { name: item_f },
        });
        if (!containerItem) {
            throw new Error('container item not found');
        }

        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error('contained item not found');
        }

        const allSizes = await sizeRepo.find();
        const invalidSize = allSizes.find(
            (s) => !containedItem.sizes?.some((cs) => cs.id === s.id),
        );
        if (!invalidSize) {
            throw new Error('invalid size not found');
        }

        const dto: UpdateMenuItemDto = {
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: invalidSize.id,
                    quantity: 2,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(dto, containerItem.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }, { prop: 'containedItemSize' }],
            'Invalid size',
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: quantity with value 0', async () => {
        const containerItem = await itemRepo.findOne({
            where: { name: item_f },
        });
        if (!containerItem) {
            throw new Error('container item not found');
        }

        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error('contained item not found');
        }
        if (!containedItem.sizes || containedItem.sizes.length === 0) {
            throw new Error('contained item sizes not found');
        }

        const dto: UpdateMenuItemDto = {
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: 0,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(dto, containerItem.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }, { prop: 'quantity' }],
            'Invalid quantity',
        );
    });

    it('fail validate update: nested containerMenuItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {
        const containerItem = await itemRepo.findOne({
            where: { name: item_f },
            relations: ['containerMenuItems'],
        });
        if (!containerItem) {
            throw new Error('container item not found');
        }
        if (!containerItem.variableMaxAmount) {
            throw new Error('container item does not have variableMaxAmount');
        }

        const containedItem = await itemRepo.findOne({
            where: { name: item_a },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error('contained item not found');
        }
        if (!containedItem.sizes || containedItem.sizes.length === 0) {
            throw new Error('contained item sizes not found');
        }

        const dto: UpdateMenuItemDto = {
            containerMenuItems: [
                {
                    createId: 'c1',
                    containedMenuItemId: containedItem.id,
                    containedItemSizeId: containedItem.sizes[0].id,
                    quantity: containerItem.variableMaxAmount + 1,
                },
            ],
        };

        const errors = await validator.validateUpdateNode(dto, containerItem.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'containerMenuItems', id: 'c1' }, { prop: 'quantity' }],
            'quantity must equal the variable max amount of the container',
        );
    });
});
