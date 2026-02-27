import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { getTestOrderCategoryNames } from './constants';

@Injectable()
export class OrderTestingUtil {
    private orderTypeInit: boolean;
    private orderInit: boolean;
    private orderMenuItemInit: boolean;
    constructor(
        @InjectRepository(OrderMenuItem)
        private readonly orderMenuItemRepo: Repository<OrderMenuItem>,
        @InjectRepository(OrderCategory)
        private readonly categoryRepo: Repository<OrderCategory>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,

        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,

        @InjectRepository(MenuItemContainerItem)
        private readonly menuItemContainerItemRepo: Repository<MenuItemContainerItem>,

        private readonly menuItemTestUtil: MenuItemTestingUtil,
    ) {
        this.orderTypeInit = false;
        this.orderInit = false;
        this.orderMenuItemInit = false;
    }

    // Order Type
    public async getTestOrderTypeEntities(
        testContext: DatabaseTestContext,
    ): Promise<OrderCategory[]> {
        const names = getTestOrderCategoryNames();
        const results: OrderCategory[] = [];

        for (const name of names) {
            results.push({
                name: name,
            } as OrderCategory);
        }

        return results;
    }

    public async initOrderCategoryTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.orderTypeInit) {
            return;
        }
        this.orderTypeInit = true;

        testContext.addCleanupFunction(() => this.cleanupOrderCategoryTestDatabase());
        const categories = await this.getTestOrderTypeEntities(testContext);
        for (const category of categories) {
            if (await this.categoryRepo.findOne({ where: { name: category.name } })) {
                continue;
            }
            await this.categoryRepo.save(category);
        }
    }

    public async cleanupOrderCategoryTestDatabase(): Promise<void> {
        await this.categoryRepo.deleteAll();
    }

    // Order Menu Item
    public async getTestOrderMenuItemEntities(
        testContext: DatabaseTestContext,
    ): Promise<OrderMenuItem[]> {
        await this.initOrderTestDatabase(testContext);
        await this.menuItemTestUtil.initMenuItemContainerItemTestDatabase(
            testContext,
        );

        const orders = await this.orderRepo.find();
        if (!orders) {
            throw new Error();
        }

        const menuItems = await this.menuItemRepo.find({
            relations: ['sizes'],
            where: { type: MENU_ITEM_TYPES.SINGLE },
        });
        if (!menuItems) {
            throw new Error();
        }

        let menuItemIdx = 0;
        let quantity = 1;
        let sizeIdx = 0;
        let orderItemMax = 4;
        const results: OrderMenuItem[] = [];

        for (const order of orders) {
            for (let i = 0; i < orderItemMax; i++) {
                const menuItem = menuItems[menuItemIdx++ % menuItems.length];
                if (!menuItem.sizes) {
                    throw new Error();
                }

                const size = menuItem.sizes[sizeIdx++ % menuItem.sizes?.length];

                results.push({
                    parentOrder: order,
                    menuItem,
                    quantity: quantity++,
                    size,
                } as OrderMenuItem);
            }
        }

        //Order Menu Item Container Items
        const containerMenuItems = await this.menuItemRepo.find({
            relations: [
                'sizes',
            ],
            where: { type: MENU_ITEM_TYPES.CONTAINER },
        });

        let containerItemIdx = 0;

        for (const order of orders) {
            const containerMenuItem = containerMenuItems[containerItemIdx++ % containerMenuItems.length];

            const validContainerMenuItems = await this.menuItemContainerItemRepo.find({
                where: { parentMenuItem: { id: containerMenuItem.id }, parentItemSize: { id: containerMenuItem.sizes[0].id } },
                relations: ['containedMenuItem', 'containedItemSize', 'parentMenuItem', 'parentItemSize']
            });

            if (containerMenuItem.variableMaxAmount) {
                const containerOrderItem = ({
                    parentOrder: order,
                    menuItem: containerMenuItem,
                    quantity: 1,
                    size: containerMenuItem.sizes[0],
                    containerOrderMenuItems: [] as any,
                });
                for (const validItem of validContainerMenuItems) { // factor in container size with valid container menu items
                    if (validItem.parentItemSize.id === containerMenuItem.sizes[0].id) {
                        containerOrderItem.containerOrderMenuItems.push({
                            parentOrderMenuItem: containerOrderItem,
                            containedMenuItem: validItem.containedMenuItem,
                            containedItemSize: validItem.containedItemSize,
                            quantity: containerMenuItem.variableMaxAmount,
                        });
                    }

                }
                results.push(containerOrderItem as OrderMenuItem);
            }
            else {
                const containerOrderItem = ({
                    parentOrder: order,
                    menuItem: containerMenuItem,
                    quantity: 1,
                    size: containerMenuItem.sizes[0],
                    containerOrderMenuItems: [] as any,
                });
                for (const validItem of validContainerMenuItems) { // factor in container size with valid container menu items
                    if (validItem.parentItemSize.id === containerMenuItem.sizes[0].id) {
                        containerOrderItem.containerOrderMenuItems.push({
                            parentOrderMenuItem: containerOrderItem,
                            containedMenuItem: validItem.containedMenuItem,
                            containedItemSize: validItem.containedItemSize,
                            quantity: validItem.quantity,
                        });
                    }
                }
                results.push(containerOrderItem as OrderMenuItem);
            }
        }

        return results;
    }

    public async initOrderMenuItemTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.orderMenuItemInit) {
            return;
        }
        this.orderMenuItemInit = true;

        testContext.addCleanupFunction(() =>
            this.cleanupOrderMenuItemTestDatabase(),
        );
        await this.orderMenuItemRepo.save(
            await this.getTestOrderMenuItemEntities(testContext),
        );
    }

    public async cleanupOrderMenuItemTestDatabase(): Promise<void> {
        await this.orderMenuItemRepo.deleteAll();
    }

    // Order
    public async getTestOrderEntities(
        testContext: DatabaseTestContext,
    ): Promise<Order[]> {
        await this.initOrderCategoryTestDatabase(testContext);

        const recipients: string[] = [
            'recipient_a',
            'recipient_b',
            'recipient_c',
            'recipient_d',
            'recipient_e',
            'recipient_f',
            'recipient_g',
        ];

        const fulfilltype: string[] = ['pickup', 'delivery'];
        let fIdx = 0;

        const orderTypes = await this.categoryRepo.find();
        if (!orderTypes) {
            throw new Error();
        }
        let otIndex = 0;

        const results: Order[] = [];
        let idx = 0;

        const fulfillmentDate = new Date();
        fulfillmentDate.setDate(fulfillmentDate.getDate() + idx);

        for (const name of recipients) {
            results.push({
                category: orderTypes[otIndex++ % orderTypes.length],
                recipient: name,
                fulfillmentDate,
                fulfillmentType: fulfilltype[fIdx++ % fulfilltype.length],
                deliveryAddress: 'delAddress' + idx,
                phoneNumber: 'number' + idx,
                email: 'email' + idx,
                note: 'note' + idx,
                isFrozen: false,
                isWeekly: false,
            } as Order);
            idx++;
        }
        return results;
    }

    public async initOrderTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.orderInit) {
            return;
        }
        this.orderInit = true;

        testContext.addCleanupFunction(() => this.cleanupOrderTestDatabase());
        await this.orderRepo.save(await this.getTestOrderEntities(testContext));
    }

    public async cleanupOrderTestDatabase(): Promise<void> {
        await this.orderRepo.deleteAll();
    }

    // Dtos

    public async createNestedOrderMenuItemDtos(
        amount: number,
    ): Promise<NestedCreateOrderMenuItemDto[]> {
        const items = await this.menuItemRepo.find({
            relations: ['sizes'],
        });
        if (!items) {
            throw new Error();
        }

        const results: NestedCreateOrderMenuItemDto[] = [];
        for (let i = 0; i < amount; i++) {
            let createId = 1;
            const item = items[i % items.length];
            if (!item.sizes) {
                throw new Error();
            }
            if (item.sizes.length === 0) {
                throw new Error();
            }

            results.push(
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: `c${createId++}`,
                    menuItemId: item.id,
                    quantity: 1,
                    sizeId: item.sizes[0].id,
                }),
            );
        }

        return results;
    }
}
