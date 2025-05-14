import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { Role } from "../entities/role.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoleController } from "../controllers/role.controller";
import { ConfigModule } from "@nestjs/config";
import { User } from "../../users/entities/user.entities";
import { RoleModule } from "../role.module";
import { UserModule } from "../../users/user.module";
import { CacheModule } from "@nestjs/cache-manager";
import { LoggerModule } from "nestjs-pino";
import { AppLoggingModule } from "../../app-logging/app-logging.module";
import { RequestContextModule } from "../../request-context/request-context.module";
import { TestRequestContextService } from "../../../util/mocks/test-request-context.service";
import { RequestContextService } from "../../request-context/RequestContextService";


export async function getRoleTestingModule(): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([User, Role]),
            TypeOrmModule.forFeature([User, Role]),
            UserModule,
            RoleModule,
            AppLoggingModule,
            RequestContextModule,
            CacheModule.register(),
            LoggerModule.forRoot({
              pinoHttp: { transport: { target: 'pino-pretty' } }
            }),
          ],
          controllers: [RoleController],
          providers: [],
})
.overrideProvider(RequestContextService)
.useClass(TestRequestContextService)
.compile()};