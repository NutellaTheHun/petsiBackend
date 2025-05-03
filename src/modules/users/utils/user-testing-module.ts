import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/user.entities";
import { UserController } from "../controllers/user.controller";
import { ConfigModule } from "@nestjs/config";
import { Role } from "../../roles/entities/role.entities";
import { UserModule } from "../user.module";
import { RoleModule } from "../../roles/role.module";
import { CacheModule } from "@nestjs/cache-manager";
import { LoggerModule } from "nestjs-pino";

export async function getUserTestingModule(): Promise<TestingModule> {
     return await Test.createTestingModule({
        imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                TypeORMPostgresTestingModule([User, Role]),
                TypeOrmModule.forFeature([User, Role]),
                UserModule,
                RoleModule,
                CacheModule.register(),
                LoggerModule.forRoot({
                  pinoHttp: { transport: { target: 'pino-pretty' } }
              }),
              ],
              controllers: [UserController],
              providers: [],
}).compile()};