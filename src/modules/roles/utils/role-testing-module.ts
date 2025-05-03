import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { Role } from "../entities/role.entities";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoleController } from "../controllers/role.controller";
import { ConfigModule } from "@nestjs/config";
import { User } from "../../users/entities/user.entities";
import { RoleModule } from "../role.module";
import { UserModule } from "../../users/user.module";
import { CacheModule } from "@nestjs/cache-manager";


export async function getRoleTestingModule(): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([User, Role]),
            TypeOrmModule.forFeature([User, Role]),
            UserModule,
            RoleModule,
            CacheModule.register(),
          ],
          controllers: [RoleController],
          providers: [],
}).compile()};