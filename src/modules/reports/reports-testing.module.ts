import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeORMPostgresTestingModule } from '../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { DynamicPropertyConfig } from '../dynamic-properties/entities/dynamic-property-config.entity';
import { MenuItemCategory } from '../menu-items/entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../menu-items/entities/menu-item-container-item.entity';
import { MenuItemDynamicPropertyValue } from '../menu-items/entities/menu-item-dynamic-property-value.entity';
import { MenuItemSize } from '../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../menu-items/entities/menu-item.entity';
import { OrderCategory } from '../orders/entities/order-category.entity';
import { OrderContainerItem } from '../orders/entities/order-container-item.entity';
import { OrderMenuItem } from '../orders/entities/order-menu-item.entity';
import { Order } from '../orders/entities/order.entity';
import { RecurringOrderSchedule } from '../orders/entities/recurring-order-schedule.entity';
import { TestRequestContextService } from '../../test/mocks/test-request-context.service';
import { RequestContextModule } from '../request-context/request-context.module';
import { RequestContextService } from '../request-context/RequestContextService';
import { ReportDefinitionController } from './controllers/report-definition.controller';
import { ReportDefinition } from './entities/report-definition.entity';
import { ReportDefinitionService } from './services/report-definition.service';
import { ReportExecutionService } from './services/report-execution.service';

export async function getReportsTestingModule(opts?: {
    reportDefinitionServiceClass?: new (...args: any[]) => ReportDefinitionService;
}): Promise<TestingModule> {
    return Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([ReportDefinition]),
            TypeOrmModule.forFeature([ReportDefinition]),
            RequestContextModule,
        ],
        controllers: [ReportDefinitionController],
        providers: [
            opts?.reportDefinitionServiceClass
                ? { provide: ReportDefinitionService, useClass: opts.reportDefinitionServiceClass }
                : ReportDefinitionService,
            {
                provide: ReportExecutionService,
                useValue: {
                    execute: jest.fn().mockResolvedValue({ reportId: 0, name: '', generatedAt: new Date(), params: {}, sections: [] }),
                },
            },
        ],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .compile();
}

export async function getReportsExecutionTestingModule(): Promise<TestingModule> {
    return Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([]),
            TypeOrmModule.forFeature([
                ReportDefinition,
                Order,
                OrderCategory,
                OrderMenuItem,
                OrderContainerItem,
                RecurringOrderSchedule,
                MenuItem,
                MenuItemSize,
                MenuItemCategory,
                MenuItemContainerItem,
                MenuItemDynamicPropertyValue,
                DynamicPropertyConfig,
            ]),
            RequestContextModule,
        ],
        providers: [ReportDefinitionService, ReportExecutionService],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .compile();
}
