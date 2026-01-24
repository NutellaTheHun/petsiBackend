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
import { TemplateMenuItemController } from '../controllers/template-menu-item.controller';
import { TemplateController } from '../controllers/template.controller';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { TemplateMenuItemService } from '../services/template-menu-item.service';
import { TemplateService } from '../services/template.service';
import { TemplatesModule } from '../templates.module';

export async function getTemplateTestingModule(opts?: {
  templateServiceClass?: new (...args: any[]) => TemplateService;
  templateMenuItemServiceClass?: new (
    ...args: any[]
  ) => TemplateMenuItemService;
}): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeORMPostgresTestingModule([Template, TemplateMenuItem, MenuItem]),
      TypeOrmModule.forFeature([Template, TemplateMenuItem, MenuItem]),
      TemplatesModule,
      MenuItemsModule,
      CacheModule.register(),
      LoggerModule.forRoot({
        pinoHttp: { transport: { target: 'pino-pretty' } },
      }),
      AppLoggingModule,
      RequestContextModule,
    ],

    controllers: [TemplateController, TemplateMenuItemController],

    providers: [],
  })
    .overrideProvider(RequestContextService)
    .useClass(TestRequestContextService)
    .overrideProvider(TemplateService)
    .useClass(opts?.templateServiceClass || TemplateService)
    .overrideProvider(TemplateMenuItemService)
    .useClass(opts?.templateMenuItemServiceClass || TemplateMenuItemService)
    .compile();
}
