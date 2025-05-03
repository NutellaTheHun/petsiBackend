import { Test, TestingModule } from "@nestjs/testing";
import { OrderMenuItemController } from "../controllers/order-menu-item.controller";
import { OrderTypeController } from "../controllers/order-type.controller";
import { OrderController } from "../controllers/order.controller";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderType } from "../entities/order-type.entity";
import { Order } from "../entities/order.entity";
import { OrdersModule } from "../orders.module";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { MenuItemsModule } from "../../menu-items/menu-items.module";
import { CacheModule } from "@nestjs/cache-manager";
import { LoggerModule } from "nestjs-pino";

export async function getOrdersTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                OrderMenuItem,
                OrderType,
                Order,
            ]),
            TypeOrmModule.forFeature([
                OrderMenuItem,
                OrderType,
                Order,
            ]),
            MenuItemsModule,
            OrdersModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } }
            }),
        ],

        controllers: [
            OrderMenuItemController,
            OrderTypeController,
            OrderController,
        ],

        providers: [],
    }).compile();}