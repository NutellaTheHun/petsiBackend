import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { TestRequestContextService } from "../../../util/mocks/test-request-context.service";
import { AppLoggingModule } from "../../app-logging/app-logging.module";
import { RequestContextModule } from "../../request-context/request-context.module";
import { RequestContextService } from "../../request-context/RequestContextService";
import { UnitOfMeasureCategoryController } from "../controllers/unit-of-measure-category.controller";
import { UnitOfMeasureController } from "../controllers/unit-of-measure.controller";
import { UnitOfMeasureCategory } from "../entities/unit-of-measure-category.entity";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { UnitOfMeasureModule } from "../unit-of-measure.module";

export async function getUnitOfMeasureTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),

            TypeORMPostgresTestingModule([
                UnitOfMeasure,
                UnitOfMeasureCategory,
            ]),

            TypeOrmModule.forFeature([
                UnitOfMeasure,
                UnitOfMeasureCategory,
            ]),

            UnitOfMeasureModule,

            CacheModule.register(),

            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } }
            }),
            AppLoggingModule,
            RequestContextModule,
        ],
        controllers: [UnitOfMeasureController, UnitOfMeasureCategoryController],
        providers: [],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .compile()
};