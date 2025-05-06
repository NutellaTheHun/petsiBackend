import { Module } from '@nestjs/common';
import { TemplateService } from './services/template.service';
import { TemplateController } from './controllers/template.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './entities/template.entity';
import { TemplateMenuItem } from './entities/template-menu-item.entity';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { TemplateMenuItemController } from './controllers/template-menu-item.controller';
import { TemplateMenuItemService } from './services/template-menu-item.service';
import { TemplateBuilder } from './builders/template.builder';
import { TemplateMenuItemBuilder } from './builders/template-menu-item.builder';
import { TemplateTestingUtil } from './utils/template-testing.util';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';
import { TemplateValidator } from './validators/template.validator';
import { TemplateMenuItemValidator } from './validators/template-menu-item.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Template,
      TemplateMenuItem,
    ]),
    MenuItemsModule,
    CacheModule.register(),
    LoggerModule,
  ],
  controllers: [
    TemplateController,
    TemplateMenuItemController,
  ],
  providers: [
    TemplateService,
    TemplateMenuItemService,

    TemplateBuilder,
    TemplateMenuItemBuilder,

    TemplateValidator,
    TemplateMenuItemValidator,

    TemplateTestingUtil,
  ],
  exports: [
    TemplateService,
    TemplateMenuItemService,
    TemplateTestingUtil,
  ]
})
export class TemplatesModule {}
