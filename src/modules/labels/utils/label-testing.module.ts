import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { Label } from "../entities/label.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LabelsModule } from "../labels.module";
import { MenuItemsModule } from "../../menu-items/menu-items.module";
import { LabelController } from "../controllers/label.controller";

export async function getLabelsTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                Label,
            ]),
            TypeOrmModule.forFeature([
                Label,
            ]),
            LabelsModule,
            MenuItemsModule,
        ],
        
        controllers: [
            LabelController,
        ],

        providers: [],
    }).compile();}