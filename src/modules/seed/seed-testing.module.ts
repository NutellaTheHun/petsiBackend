import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { TypeORMPostgresTestingModule } from "../../typeorm/configs/TypeORMPostgresTesting";
import { TestRequestContextService } from "../../util/mocks/test-request-context.service";
import { AppLoggingModule } from "../app-logging/app-logging.module";
import { RequestContextModule } from "../request-context/request-context.module";
import { RequestContextService } from "../request-context/RequestContextService";
import { Role } from "../roles/entities/role.entity";
import { RoleModule } from "../roles/role.module";
import { User } from "../users/entities/user.entities";
import { UserModule } from "../users/user.module";
import { SeedModule } from "./seed.module";

export async function getSeedTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                User,
                Role
            ]),
            TypeOrmModule.forFeature([
                User,
                Role
            ]),
            SeedModule,
            UserModule,
            RoleModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } }
            }),
            AppLoggingModule,
            RequestContextModule,
        ],

        providers: [],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .compile()
};