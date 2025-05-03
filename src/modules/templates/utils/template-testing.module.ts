import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { Template } from "../entities/template.entity";
import { TemplateMenuItem } from "../entities/template-menu-item.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TemplatesModule } from "../templates.module";
import { TemplateController } from "../controllers/template.controller";
import { TemplateMenuItemController } from "../controllers/template-menu-item.controller";
import { MenuItemsModule } from "../../menu-items/menu-items.module";
import { CacheModule } from "@nestjs/cache-manager";
import { LoggerModule } from "nestjs-pino";

export async function getTemplateTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true}),
            TypeORMPostgresTestingModule([
                Template,
                TemplateMenuItem,
            ]),
            TypeOrmModule.forFeature([
                Template,
                TemplateMenuItem,
            ]),
            TemplatesModule,
            MenuItemsModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } }
            }),
        ],

        controllers: [
            TemplateController,
            TemplateMenuItemController,
        ],

        providers: [],
    }).compile()}