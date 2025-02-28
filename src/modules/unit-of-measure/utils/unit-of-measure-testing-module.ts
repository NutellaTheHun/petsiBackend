import { Test, TestingModule } from "@nestjs/testing";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { UnitCategory } from "../entities/unit-category.entity";
import { ConfigModule } from "@nestjs/config";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UnitOfMeasureModule } from "../unit-of-measure.module";
import { UnitOfMeasureController } from "../controllers/unit-of-measure.controller";
import { UnitCategoryController } from "../controllers/unit-category.controller";
import { UnitOfMeasureService } from "../services/unit-of-measure.service";
import { UnitCategoryService } from "../services/unit-category.service";
import { forwardRef } from "@nestjs/common";

export async function getUnitOfMeasureTestingModule(): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([UnitOfMeasure, UnitCategory]),
            TypeOrmModule.forFeature([UnitOfMeasure, UnitCategory]),
            UnitOfMeasureModule,
          ],
          controllers: [UnitOfMeasureController, UnitCategoryController],
          providers: [],
}).compile()};