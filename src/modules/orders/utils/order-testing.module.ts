import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { TestRequestContextService } from "../../../util/mocks/test-request-context.service";
import { AppLoggingModule } from "../../app-logging/app-logging.module";
import { MenuItemsModule } from "../../menu-items/menu-items.module";
import { RequestContextModule } from "../../request-context/request-context.module";
import { RequestContextService } from "../../request-context/RequestContextService";
import { OrderCategoryController } from "../controllers/order-category.controller";
import { OrderContainerItemController } from "../controllers/order-container-item.controller";
import { OrderMenuItemController } from "../controllers/order-menu-item.controller";
import { OrderController } from "../controllers/order.controller";
import { OrderCategory } from "../entities/order-category.entity";
import { OrderContainerItem } from "../entities/order-container-item.entity";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { Order } from "../entities/order.entity";
import { OrdersModule } from "../orders.module";

export async function getOrdersTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                OrderMenuItem,
                OrderCategory,
                Order,
                OrderContainerItem,
            ]),
            TypeOrmModule.forFeature([
                OrderMenuItem,
                OrderCategory,
                Order,
                OrderContainerItem,
            ]),
            MenuItemsModule,
            OrdersModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } }
            }),
            AppLoggingModule,
            RequestContextModule,
        ],

        controllers: [
            OrderMenuItemController,
            OrderCategoryController,
            OrderController,
            OrderContainerItemController,
        ],

        providers: [],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .compile()
};