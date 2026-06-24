import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { AppUnit, UNITS } from '../../../common/units';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemCategoryBuilder } from '../builders/inventory-item-category.builder';
import { InventoryItemPackageBuilder } from '../builders/inventory-item-package.builder';
import { InventoryItemSizeBuilder } from '../builders/inventory-item-size.builder';
import { InventoryItemVendorBuilder } from '../builders/inventory-item-vendor.builder';
import { InventoryItemBuilder } from '../builders/inventory-item.builder';
import { NestedCreateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import * as CONSTANT from './constants';

@Injectable()
export class InventoryItemTestingUtil {
    private readonly vendorNames: string[] = CONSTANT.getInventoryVendorNames();

    private readonly categoryNames: string[] = [
        CONSTANT.OTHER_CAT,
        CONSTANT.DRYGOOD_CAT,
        CONSTANT.DAIRY_CAT,
        CONSTANT.FOOD_CAT,
    ];

    private readonly packageNames: string[] = CONSTANT.getInventoryPackageNames();

    private readonly itemNames: string[] = CONSTANT.getInventoryItemNames();

    private readonly foodItemNames: string[] = CONSTANT.getInventoryFoodItemNames();
    private readonly dryItemNames: string[] = CONSTANT.getInventoryDryItemNames();
    private readonly otherItemNames: string[] = CONSTANT.getInventoryOtherItemNames();

    private readonly unitValues: AppUnit[] = Object.values(UNITS);

    private initCategory = false;
    private initPackage = false;
    private initSize = false;
    private initVendor = false;
    private initItem = false;

    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly vendorRepo: Repository<InventoryItemVendor>,
        private readonly vendorBuilder: InventoryItemVendorBuilder,

        @InjectRepository(InventoryItemPackage)
        private readonly packageRepo: Repository<InventoryItemPackage>,
        private readonly packageBuilder: InventoryItemPackageBuilder,

        @InjectRepository(InventoryItemCategory)
        private readonly categoryRepo: Repository<InventoryItemCategory>,
        private readonly categoryBuilder: InventoryItemCategoryBuilder,

        @InjectRepository(InventoryItemSize)
        private readonly sizeRepo: Repository<InventoryItemSize>,
        private readonly sizeBuilder: InventoryItemSizeBuilder,

        @InjectRepository(InventoryItem)
        private readonly itemRepo: Repository<InventoryItem>,
        private readonly itemBuilder: InventoryItemBuilder,
    ) { }

    /**
     * Dependencies: None
     * @returns 3 vendors, VendorA, B, and C
     */
    public async getTestInventoryItemVendorEntities(
        testContext: DatabaseTestContext,
    ): Promise<InventoryItemVendor[]> {
        const results: InventoryItemVendor[] = [];
        for (const name of this.vendorNames) {
            results.push(await this.vendorBuilder.reset().name(name).build());
        }
        return results;
    }

    /**
     * Dependencies: None
     * @returns 6 package types: bag, package, box, other, container, can
     */
    public async getTestInventoryItemPackageEntities(
        testContext: DatabaseTestContext,
    ): Promise<InventoryItemPackage[]> {
        const results: InventoryItemPackage[] = [];
        for (const name of this.packageNames) {
            results.push(await this.packageBuilder.reset().name(name).build());
        }
        return results;
    }

    /**
     * Dependencies: None
     * @returns 4 Categories, FOOD, OTHER, DRYGOOD, DAIRY
     */
    public async getTestInventoryItemCategoryEntities(
        testContext: DatabaseTestContext,
    ): Promise<InventoryItemCategory[]> {
        const results: InventoryItemCategory[] = [];
        for (const name of this.categoryNames) {
            results.push(
                await this.categoryBuilder.reset().categoryName(name).build(),
            );
        }
        return results;
    }

    /**
     * Dependencies: InventoryItemCategory, InventoryItemVendor
     * @returns 9 Inventory Items
     */
    public async getTestInventoryItemEntities(
        testContext: DatabaseTestContext,
    ): Promise<InventoryItem[]> {
        await this.initInventoryItemVendorTestDatabase(testContext);
        await this.initInventoryItemCategoryTestDatabase(testContext);

        const results: InventoryItem[] = [];
        for (let i = 0; i < this.foodItemNames.length; i++) {
            results.push(
                await this.itemBuilder
                    .reset()
                    .name(this.foodItemNames[i])
                    .categoryByName(CONSTANT.FOOD_CAT)
                    .vendorByName(this.vendorNames[i % this.vendorNames.length])
                    .build(),
            );
        }
        for (let i = 0; i < this.dryItemNames.length; i++) {
            results.push(
                await this.itemBuilder
                    .reset()
                    .name(this.dryItemNames[i])
                    .categoryByName(CONSTANT.DRYGOOD_CAT)
                    .vendorByName(this.vendorNames[i % this.vendorNames.length])
                    .build(),
            );
        }
        for (let i = 0; i < this.otherItemNames.length; i++) {
            results.push(
                await this.itemBuilder
                    .reset()
                    .name(this.otherItemNames[i])
                    .categoryByName(CONSTANT.OTHER_CAT)
                    .vendorByName(this.vendorNames[i % this.vendorNames.length])
                    .build(),
            );
        }
        return results;
    }

    /**
     * Dependencies: InventoryItem, InventoryItemPackage
     * @returns 2 sizes for each inventory item (9 items)
     */
    public async getTestInventoryItemSizeEntities(
        testContext: DatabaseTestContext,
    ): Promise<InventoryItemSize[]> {
        await this.initInventoryItemTestDatabase(testContext);
        await this.initInventoryItemPackageTestDatabase(testContext);

        const results: InventoryItemSize[] = [];
        let unitIdx = 0;
        let pkgIdx = 0;
        let costVal = 0;
        for (let i = 0; i < this.itemNames.length; i++) {
            results.push(
                await this.sizeBuilder
                    .reset()
                    .inventoryItemByName(this.itemNames[i])
                    .unit(this.unitValues[unitIdx++ % this.unitValues.length])
                    .packageByName(this.packageNames[pkgIdx++ % this.packageNames.length])
                    .costByValue(costVal++)
                    .measureAmount(1)
                    .build(),
            );
            results.push(
                await this.sizeBuilder
                    .reset()
                    .inventoryItemByName(this.itemNames[i])
                    .unit(this.unitValues[unitIdx++ % this.unitValues.length])
                    .packageByName(this.packageNames[pkgIdx++ % this.packageNames.length])
                    .costByValue(costVal++)
                    .measureAmount(1)
                    .build(),
            );
        }
        return results;
    }

    public async initInventoryItemVendorTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initVendor) {
            return;
        }
        this.initVendor = true;

        testContext.addCleanupFunction(() =>
            this.cleanupInventoryItemVendorTestDatabase(),
        );

        const vendors = await this.getTestInventoryItemVendorEntities(testContext);
        for (const vendor of vendors) {
            if (await this.vendorRepo.findOne({ where: { name: vendor.name } })) {
                continue;
            }
            await this.vendorRepo.save(vendor);
        }
    }

    public async initInventoryItemPackageTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initPackage) {
            return;
        }
        this.initPackage = true;

        testContext.addCleanupFunction(() =>
            this.cleanupInventoryItemPackageTestDatabase(),
        );

        const packages = await this.getTestInventoryItemPackageEntities(testContext);
        for (const pkg of packages) {
            if (await this.packageRepo.findOne({ where: { name: pkg.name } })) {
                continue;
            }
            await this.packageRepo.save(pkg);
        }
    }

    public async initInventoryItemCategoryTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initCategory) {
            return;
        }
        this.initCategory = true;

        testContext.addCleanupFunction(() =>
            this.cleanupInventoryItemCategoryTestDatabase(),
        );

        const categories = await this.getTestInventoryItemCategoryEntities(testContext);
        for (const category of categories) {
            if (await this.categoryRepo.findOne({ where: { name: category.name } })) {
                continue;
            }
            await this.categoryRepo.save(category);
        }
    }

    public async initInventoryItemTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initItem) {
            return;
        }

        this.initItem = true;

        testContext.addCleanupFunction(() =>
            this.cleanupInventoryItemTestDatabase(),
        );
        const items = await this.getTestInventoryItemEntities(testContext);
        for (const item of items) {
            if (await this.itemRepo.findOne({ where: { name: item.name } })) {
                continue;
            }
            await this.itemRepo.save(item);
        }
    }

    public async initInventoryItemSizeTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initSize) {
            return;
        }
        this.initSize = true;

        testContext.addCleanupFunction(() =>
            this.cleanupInventoryItemSizeTestDatabase(),
        );

        await this.sizeRepo.insert(
            await this.getTestInventoryItemSizeEntities(testContext),
        );
    }

    public async cleanupInventoryItemVendorTestDatabase(): Promise<void> {
        this.initVendor = false;
        await this.vendorRepo.deleteAll();
    }

    public async cleanupInventoryItemPackageTestDatabase(): Promise<void> {
        this.initPackage = false;
        await this.packageRepo.deleteAll();
    }

    public async cleanupInventoryItemCategoryTestDatabase(): Promise<void> {
        this.initCategory = false;
        await this.categoryRepo.deleteAll();
    }

    public async cleanupInventoryItemSizeTestDatabase(): Promise<void> {
        this.initSize = false;
        await this.sizeRepo.deleteAll();
    }

    public async cleanupInventoryItemTestDatabase(): Promise<void> {
        this.initItem = false;
        await this.itemRepo.deleteAll();
    }

    /**
     * - Create's inventoryItemSize dtos for create method of an inventory item with an uneven distribution of properties.
     * - Distribution of units is normal
     * - Distribution of packages is not equal with the use of a second iterator
     * - Distribution of costs is not equal with the use of a second iterator
     */
    public createNestedInventoryItemSizeDtos(
        resultAmount: number,
        packageIds: number[],
        units: AppUnit[],
        costs: number[],
    ): NestedCreateInventoryItemSizeDto[] {
        const results: NestedCreateInventoryItemSizeDto[] = [];

        let packageIdx = 0;
        let costIdx = 0;
        let unitIdx = 0;

        let packageIter = 0;
        let costIter = 0;
        let createId = 1;

        for (let i = 0; i < resultAmount; i++) {
            results.push(
                plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: `c${createId++}`,
                    unit: units[unitIdx++ % units.length],
                    packageId: packageIds[packageIdx++],
                    cost: costs[costIter++],
                    measureAmount: 1,
                }),
            );
            if (packageIdx === packageIds.length) {
                packageIter++;
                packageIdx = packageIter;
            }
            if (costIdx === costs.length) {
                costIter++;
                costIdx = costIter;
            }
        }
        return results;
    }
}
