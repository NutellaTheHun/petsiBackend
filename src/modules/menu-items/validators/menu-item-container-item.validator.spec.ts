import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationMessage } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { item_a, item_b, item_f, item_g } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';

describe('menu item container item validator', () => {
  let testingUtil: MenuItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let validator: MenuItemContainerItemValidator;
  let containerItemRepo: Repository<MenuItemContainerItem>;
  let itemRepo: Repository<MenuItem>;
  let sizeRepo: Repository<MenuItemSize>;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

    validator = module.get<MenuItemContainerItemValidator>(
      MenuItemContainerItemValidator,
    );

    containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
    itemRepo = module.get(getRepositoryToken(MenuItem));
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
    const parentContainer = await itemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!parentContainer) {
      throw new Error('parent container not found');
    }
    if (!parentContainer.sizes || parentContainer.sizes.length === 0) {
      throw new Error('parent container sizes not found');
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

    const dto: CreateMenuItemContainerItemDto = {
      containedMenuItemId: containedItem.id,
      containedItemSizeId: containedItem.sizes[0].id,
      quantity: 2,
      parentMenuItemId: parentContainer.id,
      parentItemSizeId: parentContainer.sizes[0].id,
    };

    const errors = await validator.validateCreateNode(dto);
    expect(errors).toBeNull();
  });

  it('fail validate create: contained item not of type single', async () => {
    const parentContainer = await itemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!parentContainer) {
      throw new Error('parent container not found');
    }
    if (!parentContainer.sizes || parentContainer.sizes.length === 0) {
      throw new Error('parent container sizes not found');
    }

    const containedContainer = await itemRepo.findOne({
      where: { name: item_g },
      relations: ['sizes'],
    });
    if (!containedContainer) {
      throw new Error('contained container not found');
    }
    if (!containedContainer.sizes || containedContainer.sizes.length === 0) {
      throw new Error('contained container sizes not found');
    }

    const dto: CreateMenuItemContainerItemDto = {
      containedMenuItemId: containedContainer.id,
      containedItemSizeId: containedContainer.sizes[0].id,
      quantity: 2,
      parentMenuItemId: parentContainer.id,
      parentItemSizeId: parentContainer.sizes[0].id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'containedMenuItem' }],
      'contained item must be of type single',
    );
  });

  it('fail validate create: invalid contained item size', async () => {
    const parentContainer = await itemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!parentContainer) {
      throw new Error('parent container not found');
    }
    if (!parentContainer.sizes || parentContainer.sizes.length === 0) {
      throw new Error('parent container sizes not found');
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

    const dto: CreateMenuItemContainerItemDto = {
      containedMenuItemId: containedItem.id,
      containedItemSizeId: invalidSize.id,
      quantity: 2,
      parentMenuItemId: parentContainer.id,
      parentItemSizeId: parentContainer.sizes[0].id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'containedItemSize' }],
      'Invalid size',
    );
  });

  it('fail validate create: quantity with value 0', async () => {
    const parentContainer = await itemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!parentContainer) {
      throw new Error('parent container not found');
    }
    if (!parentContainer.sizes || parentContainer.sizes.length === 0) {
      throw new Error('parent container sizes not found');
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

    const dto: CreateMenuItemContainerItemDto = {
      containedMenuItemId: containedItem.id,
      containedItemSizeId: containedItem.sizes[0].id,
      quantity: 0,
      parentMenuItemId: parentContainer.id,
      parentItemSizeId: parentContainer.sizes[0].id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(errors, [{ prop: 'quantity' }], 'Invalid quantity');
  });

  it('fail validate create: parent menu item cannot be equal to contained menu item', async () => {
    const parentContainer = await itemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!parentContainer) {
      throw new Error('parent container not found');
    }
    if (!parentContainer.sizes || parentContainer.sizes.length === 0) {
      throw new Error('parent container sizes not found');
    }

    const dto: CreateMenuItemContainerItemDto = {
      containedMenuItemId: parentContainer.id,
      containedItemSizeId: parentContainer.sizes[0].id,
      quantity: 2,
      parentMenuItemId: parentContainer.id,
      parentItemSizeId: parentContainer.sizes[0].id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'parentMenuItem' }],
      'parent menu item cannot be equal to contained menu item',
    );
  });

  it('fail validate create: parent item not of type container', async () => {
    const singleItem = await itemRepo.findOne({
      where: { name: item_a },
      relations: ['sizes'],
    });
    if (!singleItem) {
      throw new Error('single item not found');
    }
    if (!singleItem.sizes || singleItem.sizes.length === 0) {
      throw new Error('single item sizes not found');
    }

    const containedItem = await itemRepo.findOne({
      where: { name: item_b },
      relations: ['sizes'],
    });
    if (!containedItem) {
      throw new Error('contained item not found');
    }
    if (!containedItem.sizes || containedItem.sizes.length === 0) {
      throw new Error('contained item sizes not found');
    }

    const dto: CreateMenuItemContainerItemDto = {
      containedMenuItemId: containedItem.id,
      containedItemSizeId: containedItem.sizes[0].id,
      quantity: 2,
      parentMenuItemId: singleItem.id,
      parentItemSizeId: singleItem.sizes[0].id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'parentMenuItem' }],
      'parent item must be of type container',
    );
  });

  it('fail validate create: invalid parent item size', async () => {
    const parentContainer = await itemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!parentContainer) {
      throw new Error('parent container not found');
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

    const allSizes = await sizeRepo.find();
    const invalidSize = allSizes.find(
      (s) => !parentContainer.sizes?.some((ps) => ps.id === s.id),
    );
    if (!invalidSize) {
      throw new Error('invalid size not found');
    }

    const dto: CreateMenuItemContainerItemDto = {
      containedMenuItemId: containedItem.id,
      containedItemSizeId: containedItem.sizes[0].id,
      quantity: 2,
      parentMenuItemId: parentContainer.id,
      parentItemSizeId: invalidSize.id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'parentItemSize' }],
      'Invalid size',
    );
  });

  it('fail validate create: parent with variable max amount and quantity not equal to variable max amount', async () => {
    const parentContainer = await itemRepo.findOne({
      where: { name: item_f },
      relations: ['sizes'],
    });
    if (!parentContainer) {
      throw new Error('parent container not found');
    }
    if (!parentContainer.sizes || parentContainer.sizes.length === 0) {
      throw new Error('parent container sizes not found');
    }
    if (!parentContainer.variableMaxAmount) {
      throw new Error('parent container does not have variableMaxAmount');
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

    const dto: CreateMenuItemContainerItemDto = {
      containedMenuItemId: containedItem.id,
      containedItemSizeId: containedItem.sizes[0].id,
      quantity: parentContainer.variableMaxAmount + 1,
      parentMenuItemId: parentContainer.id,
      parentItemSizeId: parentContainer.sizes[0].id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'quantity' }],
      'quantity must equal the variable max amount of the container',
    );
  });

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {
    const containerItemToUpdate = await containerItemRepo.findOne({
      relations: [
        'containedMenuItem',
        'containedItemSize',
        'parentMenuItem',
        'parentItemSize',
      ],
    });
    if (!containerItemToUpdate) {
      throw new Error('container item not found');
    }

    const dto: UpdateMenuItemContainerItemDto = {
      quantity: 5,
    };

    const errors = await validator.validateUpdateNode(
      dto,
      containerItemToUpdate.id,
    );
    expect(errors).toBeNull();
  });

  it('fail validate update: contained item not of type single', async () => {
    const containerItemToUpdate = await containerItemRepo.findOne({
      relations: [
        'containedMenuItem',
        'containedItemSize',
        'parentMenuItem',
        'parentItemSize',
      ],
    });
    if (!containerItemToUpdate) {
      throw new Error('container item not found');
    }

    const containerItem = await itemRepo.findOne({
      where: { type: MENU_ITEM_TYPES.CONTAINER },
    });
    if (!containerItem) {
      throw new Error('container item not found');
    }

    const dto: UpdateMenuItemContainerItemDto = {
      containedMenuItemId: containerItem.id,
    };

    const errors = await validator.validateUpdateNode(
      dto,
      containerItemToUpdate.id,
    );
    expectValidationMessage(
      errors,
      [{ prop: 'containedMenuItem' }],
      'contained item must be of type single',
    );
  });

  it('fail validate update: invalid contained item size (dto with itemSizeId, pre-existing contained item)', async () => {
    const containerItemToUpdate = await containerItemRepo.findOne({
      relations: [
        'containedMenuItem',
        'containedItemSize',
        'parentMenuItem',
        'parentItemSize',
      ],
    });
    if (!containerItemToUpdate) {
      throw new Error('container item not found');
    }

    const allSizes = await sizeRepo.find();
    const invalidSize = allSizes.find(
      (s) =>
        !containerItemToUpdate.containedMenuItem.sizes?.some(
          (cs) => cs.id === s.id,
        ),
    );
    if (!invalidSize) {
      throw new Error('invalid size not found');
    }

    const dto: UpdateMenuItemContainerItemDto = {
      containedItemSizeId: invalidSize.id,
    };

    const errors = await validator.validateUpdateNode(
      dto,
      containerItemToUpdate.id,
    );
    expectValidationMessage(
      errors,
      [{ prop: 'containedItemSize' }],
      'Invalid size',
    );
  });

  it('fail validate update: invalid contained item size (dto with itemSizeId, and containedItemId)', async () => {
    const containerItemToUpdate = await containerItemRepo.findOne({
      relations: [
        'containedMenuItem',
        'containedItemSize',
        'parentMenuItem',
        'parentItemSize',
      ],
    });
    if (!containerItemToUpdate) {
      throw new Error('container item not found');
    }

    const newContainedItem = await itemRepo.findOne({
      where: { name: item_b },
      relations: ['sizes'],
    });
    if (!newContainedItem) {
      throw new Error('new contained item not found');
    }

    const allSizes = await sizeRepo.find();
    const invalidSize = allSizes.find(
      (s) => !newContainedItem.sizes?.some((cs) => cs.id === s.id),
    );
    if (!invalidSize) {
      throw new Error('invalid size not found');
    }

    const dto: UpdateMenuItemContainerItemDto = {
      containedMenuItemId: newContainedItem.id,
      containedItemSizeId: invalidSize.id,
    };

    const errors = await validator.validateUpdateNode(
      dto,
      containerItemToUpdate.id,
    );
    expectValidationMessage(
      errors,
      [{ prop: 'containedItemSize' }],
      'Invalid size',
    );
  });

  it('fail validate update: quantity with value 0', async () => {
    const containerItemToUpdate = await containerItemRepo.findOne({});
    if (!containerItemToUpdate) {
      throw new Error('container item not found');
    }

    const dto: UpdateMenuItemContainerItemDto = {
      quantity: 0,
    };

    const errors = await validator.validateUpdateNode(
      dto,
      containerItemToUpdate.id,
    );
    expectValidationMessage(errors, [{ prop: 'quantity' }], 'Invalid quantity');
  });

  it('fail validate update: parent menu item cannot be equal to contained menu item', async () => {
    const containerItemToUpdate = await containerItemRepo.findOne({
      relations: [
        'containedMenuItem',
        'containedItemSize',
        'parentMenuItem',
        'parentItemSize',
      ],
    });
    if (!containerItemToUpdate) {
      throw new Error('container item not found');
    }

    const dto: UpdateMenuItemContainerItemDto = {
      containedMenuItemId: containerItemToUpdate.parentMenuItem.id,
    };

    const errors = await validator.validateUpdateNode(
      dto,
      containerItemToUpdate.id,
    );
    expectValidationMessage(
      errors,
      [{ prop: 'containedMenuItem' }],
      'contained item cannot be equal to parent item',
    );
  });

  it('fail validate update: containedItemId item not of type single', async () => {
    const containerItemToUpdate = await containerItemRepo.findOne({});
    if (!containerItemToUpdate) {
      throw new Error('container item not found');
    }

    const containerItem = await itemRepo.findOne({
      where: { type: MENU_ITEM_TYPES.CONTAINER },
    });
    if (!containerItem) {
      throw new Error('container item not found');
    }

    const dto: UpdateMenuItemContainerItemDto = {
      containedMenuItemId: containerItem.id,
    };

    const errors = await validator.validateUpdateNode(
      dto,
      containerItemToUpdate.id,
    );
    expectValidationMessage(
      errors,
      [{ prop: 'containedMenuItem' }],
      'contained item must be of type single',
    );
  });

  it('fail validate update: parent with variable max amount and quantity not equal to variable max amount', async () => {
    const containerItemToUpdate = await containerItemRepo.findOne({
      relations: [
        'containedMenuItem',
        'containedItemSize',
        'parentMenuItem',
        'parentItemSize',
      ],
    });
    if (!containerItemToUpdate) {
      throw new Error('container item not found');
    }
    if (!containerItemToUpdate.parentMenuItem.variableMaxAmount) {
      throw new Error('parent does not have variableMaxAmount');
    }

    const dto: UpdateMenuItemContainerItemDto = {
      quantity: containerItemToUpdate.parentMenuItem.variableMaxAmount + 1,
    };

    const errors = await validator.validateUpdateNode(
      dto,
      containerItemToUpdate.id,
    );
    expectValidationMessage(
      errors,
      [{ prop: 'quantity' }],
      'quantity must equal the variable max amount of the container',
    );
  });
});
