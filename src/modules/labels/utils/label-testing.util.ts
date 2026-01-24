import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { LabelType } from '../entities/label-type.entity';
import { Label } from '../entities/label.entity';
import { getTestImageUrls, getTestLabelTypeNames } from './constants';

@Injectable()
export class LabelTestingUtil {
  private initLabels = false;
  private initLabelTypes = false;

  constructor(
    @InjectRepository(Label)
    private readonly labelRepo: Repository<Label>,
    @InjectRepository(LabelType)
    private readonly typeRepo: Repository<LabelType>,

    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,

    private readonly menuItemTestUtil: MenuItemTestingUtil,
  ) {}

  // Label Types
  public async getTestLabelTypeEntities(
    testContext: DatabaseTestContext,
  ): Promise<LabelType[]> {
    const names = getTestLabelTypeNames();
    const dimensions = [
      { l: 200, w: 400 },
      { l: 100, w: 200 },
      { l: 300, w: 600 },
      { l: 400, w: 800 },
    ];
    let dimensionIdx = 0;
    const results: LabelType[] = [];

    for (const name of names) {
      const dimension = dimensions[dimensionIdx % dimensions.length];

      results.push({
        name: name,
        length: dimension.l,
        width: dimension.w,
      } as LabelType);

      dimensionIdx++;
    }

    return results;
  }

  public async initLabelTypeTestDatabase(
    testContext: DatabaseTestContext,
  ): Promise<void> {
    if (this.initLabelTypes) {
      return;
    }
    this.initLabelTypes = true;

    testContext.addCleanupFunction(() => this.cleanupLabelTypeTestDatabase());

    await this.typeRepo.insert(
      await this.getTestLabelTypeEntities(testContext),
    );
  }

  public async cleanupLabelTypeTestDatabase(): Promise<void> {
    await this.typeRepo.delete({});
  }

  // Label
  public async getTestLabelEntities(
    testContext: DatabaseTestContext,
  ): Promise<Label[]> {
    await this.initLabelTypeTestDatabase(testContext);

    const types = await this.typeRepo.find();
    if (!types) {
      throw new Error();
    }

    let typeIdx = 0;

    const urls = getTestImageUrls();

    await this.menuItemTestUtil.initMenuItemTestDatabase(testContext);
    const items = await this.itemRepo.find();
    if (!items) {
      throw new Error();
    }
    let itemIdx = 0;

    const results: Label[] = [];

    for (const url of urls) {
      results.push({
        menuItem: items[itemIdx++ % items.length],
        imageUrl: url,
        labelType: types[typeIdx++ % types.length],
      } as Label);
    }

    return results;
  }

  public async initLabelTestDatabase(
    testContext: DatabaseTestContext,
  ): Promise<void> {
    if (this.initLabels) {
      return;
    }
    this.initLabels = true;

    testContext.addCleanupFunction(() => this.cleanupLabelTestDatabase());

    await this.labelRepo.insert(await this.getTestLabelEntities(testContext));
  }

  public async cleanupLabelTestDatabase(): Promise<void> {
    await this.labelRepo.delete({});
  }
}
