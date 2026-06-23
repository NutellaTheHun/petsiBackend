import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { OrderCategory } from '../../orders/entities/order-category.entity';
import { OrderContainerItem } from '../../orders/entities/order-container-item.entity';
import { OrderMenuItem } from '../../orders/entities/order-menu-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { RecurringOrderSchedule } from '../../orders/entities/recurring-order-schedule.entity';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { MenuItemCategoryController } from '../controllers/menu-item-category.controller';
import { MenuItemContainerItemController } from '../controllers/menu-item-container-item.controller';
import { MenuItemSizeController } from '../controllers/menu-item-size.controller';
import { MenuItemController } from '../controllers/menu-item.controller';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemsModule } from '../menu-items.module';
import { MenuItemCategoryService } from '../services/menu-item-category.service';
import { MenuItemContainerItemService } from '../services/menu-item-container-item.service';
import { MenuItemSizeService } from '../services/menu-item-size.service';
import { MenuItemService } from '../services/menu-item.service';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';
import { RevisionHistory } from '../../revision-history/entities/revision-history.entity';
import { RevisionHistoryModule } from '../../revision-history/revision-history.module';
import { MenuItemCategoryChangeDetector } from './change-detectors/menu-item-category.change-detector';
import { MenuItemContainerItemChangeDetector } from './change-detectors/menu-item-container-item.change-detector';
import { MenuItemSizeChangeDetector } from './change-detectors/menu-item-size.change-detector';
import { MenuItemChangeDetector } from './change-detectors/menu-item.change-detector';

export async function getMenuItemTestingModule(opts?: {
    menuItemCategoryServiceClass?: new (
        ...args: any[]
    ) => MenuItemCategoryService;
    menuItemSizeServiceClass?: new (...args: any[]) => MenuItemSizeService;
    menuItemServiceClass?: new (...args: any[]) => MenuItemService;
    menuItemContainerItemServiceClass?: new (
        ...args: any[]
    ) => MenuItemContainerItemService;
    menuItemChangeDetectorClass?: new (...args: any[]) => MenuItemChangeDetector;
    menuItemCategoryChangeDetectorClass?: new (...args: any[]) => MenuItemCategoryChangeDetector;
    menuItemSizeChangeDetectorClass?: new (...args: any[]) => MenuItemSizeChangeDetector;
    menuItemContainerItemChangeDetectorClass?: new (...args: any[]) => MenuItemContainerItemChangeDetector;
    mockRevisionHistory?: boolean;
}): Promise<TestingModule> {
    const mockRevisionHistory = opts?.mockRevisionHistory ?? true;

    const moduleBuilder = Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                MenuItemCategory,
                MenuItemSize,
                MenuItem,
                MenuItemContainerItem,
                Order,
                OrderCategory,
                OrderMenuItem,
                OrderContainerItem,
                RecurringOrderSchedule,
                ...(mockRevisionHistory ? [] : [RevisionHistory]),
            ]),
            TypeOrmModule.forFeature([
                MenuItemCategory,
                MenuItemSize,
                MenuItem,
                MenuItemContainerItem,
                Order,
                OrderCategory,
                OrderMenuItem,
                OrderContainerItem,
                RecurringOrderSchedule,
                ...(mockRevisionHistory ? [] : [RevisionHistory]),
            ]),
            MenuItemsModule,
            ...(mockRevisionHistory ? [] : [RevisionHistoryModule]),
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } },
            }),
            AppLoggingModule,
            RequestContextModule,
        ],

        controllers: [
            MenuItemCategoryController,
            MenuItemSizeController,
            MenuItemController,
            MenuItemContainerItemController,
        ],

        providers: [],
    });

    const builderWithOverrides = moduleBuilder
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .overrideProvider(MenuItemCategoryService)
        .useClass(opts?.menuItemCategoryServiceClass || MenuItemCategoryService)
        .overrideProvider(MenuItemSizeService)
        .useClass(opts?.menuItemSizeServiceClass || MenuItemSizeService)
        .overrideProvider(MenuItemService)
        .useClass(opts?.menuItemServiceClass || MenuItemService)
        .overrideProvider(MenuItemContainerItemService)
        .useClass(
            opts?.menuItemContainerItemServiceClass ||
                MenuItemContainerItemService,
        )
        .overrideProvider(MenuItemChangeDetector)
        .useClass(opts?.menuItemChangeDetectorClass || MenuItemChangeDetector)
        .overrideProvider(MenuItemCategoryChangeDetector)
        .useClass(
            opts?.menuItemCategoryChangeDetectorClass ||
                MenuItemCategoryChangeDetector,
        )
        .overrideProvider(MenuItemSizeChangeDetector)
        .useClass(
            opts?.menuItemSizeChangeDetectorClass || MenuItemSizeChangeDetector,
        )
        .overrideProvider(MenuItemContainerItemChangeDetector)
        .useClass(
            opts?.menuItemContainerItemChangeDetectorClass ||
                MenuItemContainerItemChangeDetector,
        );

    if (mockRevisionHistory) {
        builderWithOverrides.overrideProvider(RevisionHistoryService).useValue({
            appendRevision: jest.fn().mockResolvedValue({ id: 1 }),
            listRevisions: jest.fn().mockResolvedValue([]),
            getRevisionOrThrow: jest.fn(),
            getRevisionRow: jest.fn().mockResolvedValue(null),
            removeRevisionById: jest.fn(),
        });
    }

    return await builderWithOverrides.compile();
}
