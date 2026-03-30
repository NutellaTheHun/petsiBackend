import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemsModule } from '../../menu-items/menu-items.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { LabelTypeController } from '../controllers/label-type.controller';
import { LabelController } from '../controllers/label.controller';
import { LabelType } from '../entities/label-type.entity';
import { Label } from '../entities/label.entity';
import { LabelsModule } from '../labels.module';
import { LabelTypeService } from '../services/label-type.service';
import { LabelService } from '../services/label.service';
import { LabelTypeChangeDetector } from './change-detectors/label-type.change-detector';
import { LabelChangeDetector } from './change-detectors/label.change-detector';

export async function getLabelsTestingModule(opts?: {
  labelTypeServiceClass?: new (...args: any[]) => LabelTypeService;
  labelServiceClass?: new (...args: any[]) => LabelService;
  labelTypeChangeDetectorClass?: new (...args: any[]) => LabelTypeChangeDetector;
  labelChangeDetectorClass?: new (...args: any[]) => LabelChangeDetector;
}): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),

      TypeORMPostgresTestingModule([Label, LabelType, MenuItem]),
      TypeOrmModule.forFeature([Label, LabelType, MenuItem]),

      LabelsModule,
      MenuItemsModule,

      CacheModule.register(),
      LoggerModule.forRoot({
        pinoHttp: { transport: { target: 'pino-pretty' } },
      }),
      AppLoggingModule,
      RequestContextModule,
    ],

    controllers: [LabelController, LabelTypeController],

    providers: [],
  })
    .overrideProvider(RequestContextService)
    .useClass(TestRequestContextService)
    .overrideProvider(LabelTypeService)
    .useClass(opts?.labelTypeServiceClass || LabelTypeService)
    .overrideProvider(LabelService)
    .useClass(opts?.labelServiceClass || LabelService)
    .overrideProvider(LabelTypeChangeDetector)
    .useClass(opts?.labelTypeChangeDetectorClass || LabelTypeChangeDetector)
    .overrideProvider(LabelChangeDetector)
    .useClass(opts?.labelChangeDetectorClass || LabelChangeDetector)
    .compile();
}
