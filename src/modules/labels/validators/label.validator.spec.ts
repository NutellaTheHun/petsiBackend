import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_a } from '../../menu-items/utils/constants';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { LabelType } from '../entities/label-type.entity';
import { Label } from '../entities/label.entity';
import { type_b, type_c } from '../utils/constants';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelValidator } from './label.validator';

describe('label validator', () => {
  let testingUtil: LabelTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: LabelValidator;
  let labelRepo: Repository<Label>;
  let labelTypeRepo: Repository<LabelType>;
  let itemRepo: Repository<MenuItem>;

  beforeAll(async () => {
    const module: TestingModule = await getLabelsTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
    await testingUtil.initLabelTestDatabase(dbTestContext);

    validator = module.get<LabelValidator>(LabelValidator);

    labelRepo = module.get(getRepositoryToken(Label));
    labelTypeRepo = module.get(getRepositoryToken(LabelType));
    itemRepo = module.get(getRepositoryToken(MenuItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const item = await itemService.findOneByName(item_a);
    if (!item) {
      throw new Error();
    }
    const labelType = await labelTypeService.findOneByName(type_c);
    if (!labelType) {
      throw new Error();
    }

    const dto = {
      menuItemId: item.id,
      imageUrl: 'url.com',
      labelTypeId: labelType.id,
    } as CreateLabelDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create: menuItem/labelType combination exists', async () => {
    const labelRequest = await labelService.findAll({
      relations: ['menuItem', 'labelType'],
    });
    if (!labelRequest) {
      throw new Error();
    }

    const badLabel = labelRequest.items[0];
    if (!badLabel.labelType) {
      throw new Error();
    }

    const dto = {
      menuItemId: badLabel.menuItem.id,
      imageUrl: 'url.com',
      labelTypeId: badLabel.labelType.id,
    } as CreateLabelDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('labelType');
  });

  it('should pass update', async () => {
    const labelRequest = await labelService.findAll({
      relations: ['menuItem', 'labelType'],
    });
    if (!labelRequest) {
      throw new Error();
    }

    const toUpdate = labelRequest.items[0];

    const labelType = await labelTypeService.findOneByName(type_b);
    if (!labelType) {
      throw new Error();
    }

    const dto = {
      menuItemId: toUpdate.menuItem.id,
      imageUrl: 'updateUrl',
      labelTypeId: labelType.id,
    } as UpdateLabelDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update: menuItem / labelType combination exists', async () => {
    const labelRequest = await labelService.findAll({
      relations: ['menuItem', 'labelType'],
    });
    if (!labelRequest) {
      throw new Error();
    }

    const toUpdate = labelRequest.items[0];

    const badItem = labelRequest.items[1];
    if (!badItem.labelType) {
      throw new Error();
    }

    const dto = {
      menuItemId: badItem.menuItem.id,
      imageUrl: 'newUrl',
      labelTypeId: badItem.labelType.id,
    } as UpdateLabelDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('labelType');
  });
});
