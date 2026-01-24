import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { InventoryItemsModule } from '../../inventory-items/inventory-items.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryAreaCountController } from '../controllers/inventory-area-count.controller';
import { InventoryAreaItemController } from '../controllers/inventory-area-item.controller';
import { InventoryAreaController } from '../controllers/inventory-area.controller';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreasModule } from '../inventory-areas.module';
import { InventoryAreaCountService } from '../services/inventory-area-count.service';
import { InventoryAreaItemService } from '../services/inventory-area-item.service';
import { InventoryAreaService } from '../services/inventory-area.service';

export async function getInventoryAreasTestingModule(opts?: {
  countServiceClass?: new (...args: any[]) => InventoryAreaCountService;
  areaItemServiceClass?: new (...args: any[]) => InventoryAreaItemService;
  areaServiceClass?: new (...args: any[]) => InventoryAreaService;
}): Promise<TestingModule> {
  const builder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeORMPostgresTestingModule([
        InventoryArea,
        InventoryAreaCount,
        InventoryAreaItem,
      ]),
      TypeOrmModule.forFeature([
        InventoryArea,
        InventoryAreaCount,
        InventoryAreaItem,
      ]),
      InventoryItemsModule,
      InventoryAreasModule,
      AppLoggingModule,
      RequestContextModule,
      CacheModule.register(),

      LoggerModule.forRoot({
        pinoHttp: { transport: { target: 'pino-pretty' } },
      }),
    ],
    controllers: [
      InventoryAreaController,
      InventoryAreaCountController,
      InventoryAreaItemController,
    ],
    providers: [],
  })
    .overrideProvider(RequestContextService)
    .useClass(TestRequestContextService);

  if (opts?.countServiceClass) {
    builder
      .overrideProvider(InventoryAreaCountService)
      .useClass(opts.countServiceClass);
  }

  if (opts?.areaItemServiceClass) {
    builder
      .overrideProvider(InventoryAreaItemService)
      .useClass(opts.areaItemServiceClass);
  }

  if (opts?.areaServiceClass) {
    builder
      .overrideProvider(InventoryAreaService)
      .useClass(opts.areaServiceClass);
  }

  return builder.compile();
}
