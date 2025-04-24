import { Injectable } from "@nestjs/common";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { MenuItemTestingUtil } from "../../menu-items/utils/menu-item-testing.util";
import { CreateOrderMenuItemDto } from "../dto/create-order-menu-item.dto";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderType } from "../entities/order-type.entity";
import { Order } from "../entities/order.entity";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { OrderTypeService } from "../services/order-type.service";
import { OrderService } from "../services/order.service";
import { getTestOrderTypeNames } from "./constants";

@Injectable()
export class OrderTestingUtil {

    constructor(
        private readonly orderMenuItemService: OrderMenuItemService,
        private readonly typeService: OrderTypeService,
        private readonly orderService: OrderService,

        private readonly menuItemService: MenuItemService,
        private readonly menuItemTestUtil: MenuItemTestingUtil,
    ){ }

    // Order Type
    public async getTestOrderTypeEntities(testContext: DatabaseTestContext): Promise<OrderType[]>{
        const names = getTestOrderTypeNames();
        const results: OrderType[] = [];

        for(const name of names){
            results.push({
                name: name,
            } as OrderType)
        }

        return results;
    }

    public async initOrderTypeTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        const types = await this.getTestOrderTypeEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupOrderTypeTestDatabase());

        await this.typeService.insertEntities(types);
    }
    
    public async cleanupOrderTypeTestDatabase(): Promise<void> {
        await this.typeService.getQueryBuilder().delete().execute();
    }

    // Order Menu Item
    public async getTestOrderMenuItemEntities(testContext: DatabaseTestContext): Promise<OrderMenuItem[]>{
        await this.initOrderTestDatabase(testContext);
        await this.menuItemTestUtil.initMenuItemTestDatabase(testContext);

        const orders = await this.orderService.findAll();
        if(!orders){ throw new Error(); }
        const menuItems = await this.menuItemService.findAll(['validSizes']);
        if(!menuItems){ throw new Error(); }

        let menuItemIdx = 0;
        let quantity = 1;
        let sizeIdx = 0;
        const results: OrderMenuItem[] = [];

        for(const order of orders){
            for(let i = 0; i < 4; i++){
                const menuItem = menuItems[menuItemIdx++ % menuItems.length];
                if(!menuItem.validSizes){ throw new Error(); }

                const size = menuItem.validSizes[sizeIdx++ % menuItem.validSizes?.length]

                results.push({
                    order: order,
                    menuItem,
                    quantity: quantity++,
                    size,
                } as OrderMenuItem)
            }
        }

        return results;
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
        await this.initOrderTypeTestDatabase(testContext);

        const recipients: string[] = [ "recipient_a","recipient_b","recipient_c","recipient_d","recipient_e","recipient_f", "recipient_g",];
        
        const fulfilltype: string[] = [ "fulfilltype_a", "fulfilltype_b"];
        let fIdx = 0;

        const orderTypes = await this.typeService.findAll();
        if(!orderTypes){ throw new Error(); }
        let otIndex = 0;

        const results: Order[] = [];
        let idx = 0

        const fulfillmentDate = new Date();
        fulfillmentDate.setDate(fulfillmentDate.getDate() + idx);

        for(const name of recipients){
            results.push({
                squareOrderId: "sqrIdx"+idx,
                type: orderTypes[otIndex++ % orderTypes.length],
                recipient: name,
                fulfillmentDate,
                fulfillmentType: fulfilltype[fIdx++ % fulfilltype.length],
                deliveryAddress: "delAddress"+idx,
                phoneNumber: "number"+idx,
                email: "email"+idx,
                note: "note"+idx,
                isFrozen: false,
                isWeekly: false,
            } as Order);
            idx++;
        }
        return results;
    }

    public async initOrderTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        const orders = await this.getTestOrderEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupOrderTestDatabase());

        await this.orderService.insertEntities(orders);
    }
    
    public async cleanupOrderTestDatabase(): Promise<void> {
        await this.orderService.getQueryBuilder().delete().execute();
    }

    public async getCreateOrderMenuItemDtos(amount: number): Promise<CreateOrderMenuItemDto[]> {
        const items = await this.menuItemService.findAll(['validSizes']);
        if(!items){ throw new Error(); }
        const results: CreateOrderMenuItemDto[] = [];
        for(let i = 0; i < amount; i++)
        {
            const item = items[i % items.length];
            if(!item.validSizes){ throw new Error(); }
            if(item.validSizes.length === 0){ throw new Error(); }

            results.push({
                mode: 'create',
                menuItemId: item.id,
                quantity: 1,
                menuItemSizeId: item.validSizes[0].id,
            } as CreateOrderMenuItemDto);
        }
        
        return results;
    }
}