import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/user.entities";
import { UserController } from "../controllers/user.controller";
import { ConfigModule } from "@nestjs/config";
import { Role } from "../../roles/entities/role.entity";
import { UserModule } from "../user.module";
import { RoleModule } from "../../roles/role.module";
import { CacheModule } from "@nestjs/cache-manager";
import { LoggerModule } from "nestjs-pino";
import { AppLoggingModule } from "../../app-logging/app-logging.module";
import { RequestContextModule } from "../../request-context/request-context.module";
import { TestRequestContextService } from "../../../util/mocks/test-request-context.service";
import { RequestContextService } from "../../request-context/RequestContextService";

export async function getUserTestingModule(): Promise<TestingModule> {
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
      controllers: [UserController],
      providers: [],
})
.overrideProvider(RequestContextService)
.useClass(TestRequestContextService)
.compile()};