import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { Label } from "../entities/label.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LabelsModule } from "../labels.module";
import { MenuItemsModule } from "../../menu-items/menu-items.module";
import { LabelController } from "../controllers/label.controller";
import { LabelType } from "../entities/label-type.entity";
import { LabelTypeController } from "../controllers/label-type.controller";
import { CacheModule } from "@nestjs/cache-manager";

export async function getLabelsTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                Label,
                LabelType,
            ]),
            TypeOrmModule.forFeature([
                Label,
                LabelType,
            ]),
            LabelsModule,
            MenuItemsModule,
            CacheModule.register(),
        ],
        
        controllers: [
            LabelController,
            LabelTypeController,
        ],

        providers: [],
    }).compile();}