import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
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
    ) { }

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

        const types = await this.getTestLabelTypeEntities(testContext);
        for (const type of types) {
            if (await this.typeRepo.findOne({ where: { name: type.name, length: type.length, width: type.width } })) {
                continue;
            }
            await this.typeRepo.save(type);
        }
    }

    public async cleanupLabelTypeTestDatabase(): Promise<void> {
        await this.typeRepo.deleteAll();
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

        const labels = await this.getTestLabelEntities(testContext);
        for (const label of labels) {
            if (await this.labelRepo.findOne({ where: { menuItem: { id: label.menuItem.id }, imageUrl: label.imageUrl, labelType: { id: label.labelType.id } } })) {
                continue;
            }
            await this.labelRepo.save(label);
        }
    }

    public async cleanupLabelTestDatabase(): Promise<void> {
        await this.labelRepo.deleteAll();
    }

    // ─── Atomic-prefix seed methods ──────────────────────────────────────────────
    // These do NOT register cleanup — callers are responsible for deleting by ID.

    public async seedLabelTypes(P: string = ''): Promise<{ labelTypes: LabelType[] }> {
        const names = getTestLabelTypeNames();
        const dimensions = [
            { l: 200, w: 400 },
            { l: 100, w: 200 },
            { l: 300, w: 600 },
            { l: 400, w: 800 },
        ];

        const labelTypes: LabelType[] = [];
        for (let i = 0; i < names.length; i++) {
            const name = P ? `${P}-${names[i]}` : names[i];
            const dimension = dimensions[i % dimensions.length];
            const entity = this.typeRepo.create({
                name,
                length: dimension.l,
                width: dimension.w,
            });
            labelTypes.push(await this.typeRepo.save(entity));
        }
        return { labelTypes };
    }

    /**
     * Seeds label types and menu items (via MenuItemTestingUtil.seedItems), then
     * pairs each of the 7 test image urls with a round-robin menuItem/labelType.
     */
    public async seedLabels(P: string = ''): Promise<{
        labelTypes: LabelType[];
        categories: MenuItemCategory[];
        sizes: MenuItemSize[];
        singleItems: MenuItem[];
        fixedContainerItems: MenuItem[];
        varContainerItems: MenuItem[];
        labels: Label[];
    }> {
        const { labelTypes } = await this.seedLabelTypes(P);
        const { categories, sizes, singleItems, fixedContainerItems, varContainerItems } =
            await this.menuItemTestUtil.seedItems(P);

        const urls = getTestImageUrls();
        const labels: Label[] = [];
        for (let i = 0; i < urls.length; i++) {
            const entity = this.labelRepo.create({
                menuItem: singleItems[i % singleItems.length],
                imageUrl: urls[i],
                labelType: labelTypes[i % labelTypes.length],
            });
            labels.push(await this.labelRepo.save(entity));
        }

        return { labelTypes, categories, sizes, singleItems, fixedContainerItems, varContainerItems, labels };
    }
}
