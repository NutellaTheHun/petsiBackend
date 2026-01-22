import { Injectable } from '@nestjs/common';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { LabelType } from '../entities/label-type.entity';
import { Label } from '../entities/label.entity';
import { LabelTypeService } from '../services/label-type.service';
import { LabelService } from '../services/label.service';
import { getTestImageUrls, getTestLabelTypeNames } from './constants';

@Injectable()
export class LabelTestingUtil {
  private initLabels = false;
  private initLabelTypes = false;

  constructor(
    private readonly labelService: LabelService,
    private readonly typeService: LabelTypeService,

    private readonly menuItemTestUtil: MenuItemTestingUtil,
    private readonly itemService: MenuItemService,
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

    await this.typeService.insertEntities(
      await this.getTestLabelTypeEntities(testContext),
    );
  }

  public async cleanupLabelTypeTestDatabase(): Promise<void> {
    await this.typeService.getQueryBuilder().delete().execute();
  }

  // Label
  public async getTestLabelEntities(
    testContext: DatabaseTestContext,
  ): Promise<Label[]> {
    await this.initLabelTypeTestDatabase(testContext);

    const typesRequest = await this.typeService.findAll();
    const types = typesRequest.items;
    if (!types) {
      throw new Error();
    }

    let typeIdx = 0;

    const urls = getTestImageUrls();

    await this.menuItemTestUtil.initMenuItemTestDatabase(testContext);
    const itemsRequest = await this.itemService.findAll();
    const items = itemsRequest.items;
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

    await this.labelService.insertEntities(
      await this.getTestLabelEntities(testContext),
    );
  }

  public async cleanupLabelTestDatabase(): Promise<void> {
    await this.labelService.getQueryBuilder().delete().execute();
  }
}
