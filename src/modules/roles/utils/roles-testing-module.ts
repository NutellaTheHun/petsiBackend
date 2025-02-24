import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { Role } from "../entities/role.entities";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesController } from "../roles.controller";
import { ConfigModule } from "@nestjs/config";
import { User } from "../../users/entities/user.entities";
import { RolesModule } from "../roles.module";
import { UsersModule } from "../../users/users.module";


export async function getRolesTestingModule(): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([User, Role]),
            TypeOrmModule.forFeature([User, Role]),
              UsersModule,
              RolesModule,
          ],
          controllers: [RolesController],
          providers: [],
}).compile()};