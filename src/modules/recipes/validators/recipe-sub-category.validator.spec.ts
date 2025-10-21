import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';
import { REC_SUBCAT_1, REC_SUBCAT_2, REC_SUBCAT_3 } from '../utils/constants';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryValidator } from './recipe-sub-category.validator';

describe('recipe sub category validator', () => {
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: RecipeSubCategoryValidator;
  let service: RecipeSubCategoryService;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    validator = module.get<RecipeSubCategoryValidator>(
      RecipeSubCategoryValidator,
    );
    service = module.get<RecipeSubCategoryService>(RecipeSubCategoryService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const dto = {
      subCategoryName: 'CREATE',
    } as CreateRecipeSubCategoryDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create: name already exists', async () => {
    const dto = {
      subCategoryName: REC_SUBCAT_3,
    } as CreateRecipeSubCategoryDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('subCategoryName');
  });

  it('should pass update', async () => {
    const toUpdate = await service.findOneByName(REC_SUBCAT_1);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      subCategoryName: 'UPDATE',
    } as UpdateRecipeSubCategoryDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update: name already exists', async () => {
    const toUpdate = await service.findOneByName(REC_SUBCAT_1);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      subCategoryName: REC_SUBCAT_2,
    } as UpdateRecipeSubCategoryDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('subCategoryName');
  });
});
