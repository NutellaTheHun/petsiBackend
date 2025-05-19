import { Test, TestingModule } from "@nestjs/testing";
import { OrderMenuItemController } from "../controllers/order-menu-item.controller";
import { OrderCategoryController } from "../controllers/order-category.controller";
import { OrderController } from "../controllers/order.controller";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderCategory } from "../entities/order-category.entity";
import { Order } from "../entities/order.entity";
import { OrdersModule } from "../orders.module";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { MenuItemsModule } from "../../menu-items/menu-items.module";
import { CacheModule } from "@nestjs/cache-manager";
import { LoggerModule } from "nestjs-pino";
import { AppLoggingModule } from "../../app-logging/app-logging.module";
import { RequestContextModule } from "../../request-context/request-context.module";
import { RequestContextService } from "../../request-context/RequestContextService";
import { TestRequestContextService } from "../../../util/mocks/test-request-context.service";
import { OrderContainerItem } from "../entities/order-container-item.entity";
import { OrderContainerItemController } from "../controllers/order-container-item.controller";

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
.compile()};