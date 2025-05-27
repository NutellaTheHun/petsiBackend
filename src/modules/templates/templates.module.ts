import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { TemplateMenuItemBuilder } from './builders/template-menu-item.builder';
import { TemplateBuilder } from './builders/template.builder';
import { TemplateMenuItemController } from './controllers/template-menu-item.controller';
import { TemplateController } from './controllers/template.controller';
import { TemplateMenuItem } from './entities/template-menu-item.entity';
import { Template } from './entities/template.entity';
import { TemplateMenuItemService } from './services/template-menu-item.service';
import { TemplateService } from './services/template.service';
import { TemplateTestingUtil } from './utils/template-testing.util';
import { TemplateMenuItemValidator } from './validators/template-menu-item.validator';
import { TemplateValidator } from './validators/template.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Template,
            TemplateMenuItem,
        ]),
        MenuItemsModule,
        CacheModule.register(),
        AppLoggingModule,
        RequestContextModule,
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
export class TemplatesModule { }
