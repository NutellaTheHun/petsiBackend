import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { Template } from "../entities/template.entity";
import { TemplateMenuItem } from "../entities/template-menu-item.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TemplatesModule } from "../templates.module";
import { TemplateController } from "../controllers/template.controller";
import { TemplateMenuItemController } from "../controllers/template-menu-item.controller";

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
        ],

        controllers: [
            TemplateController,
            TemplateMenuItemController,
        ],

        providers: [],
    }).compile()}