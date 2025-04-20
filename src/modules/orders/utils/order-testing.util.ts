import { forwardRef, Inject, Injectable, NotImplementedException } from "@nestjs/common";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { OrderTypeService } from "../services/order-type.service";
import { OrderService } from "../services/order.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { OrderType } from "../entities/order-type.entity";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { Order } from "../entities/order.entity";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";

@Injectable()
export class OrderTestingUtil {
    constructor(
        private readonly orderMenuItemService: OrderMenuItemService,
        private readonly orderTypeService: OrderTypeService,
        private readonly orderService: OrderService,

        private readonly menuItemService: MenuItemService,
    ){ }

    // Order Type
    public async getTestOrderTypeEntities(testContext: DatabaseTestContext): Promise<OrderType[]>{
        throw new NotImplementedException();
    }

    public async initOrderTypeTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        const types = await this.getTestOrderTypeEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupOrderTypeTestDatabase());

        await this.orderTypeService.insertEntities(types);
    }
    
    public async cleanupOrderTypeTestDatabase(): Promise<void> {
        await this.orderTypeService.getQueryBuilder().delete().execute();
    }

    // Order Menu Item
    public async getTestOrderMenuItemEntities(testContext: DatabaseTestContext): Promise<OrderMenuItem[]>{
        throw new NotImplementedException();
    }

    public async initOrderMenuItemTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        const oMenuItems = await this.getTestOrderMenuItemEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupOrderMenuItemTestDatabase());

        await this.orderMenuItemService.insertEntities(oMenuItems);
    }
    
    public async cleanupOrderMenuItemTestDatabase(): Promise<void> {
        await this.orderMenuItemService.getQueryBuilder().delete().execute();
    }

    // Order
    public async getTestOrderEntities(testContext: DatabaseTestContext): Promise<Order[]>{
        throw new NotImplementedException();
    }

    public async initOrderTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        const orders = await this.getTestOrderEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupOrderTestDatabase());

        await this.orderService.insertEntities(orders);
    }
    
    public async cleanupOrderTestDatabase(): Promise<void> {
        await this.orderService.getQueryBuilder().delete().execute();
    }
}