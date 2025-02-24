import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/user.entities";
import { UsersController } from "../users.controller";
import { ConfigModule } from "@nestjs/config";
import { Role } from "../../roles/entities/role.entities";
import { UsersModule } from "../users.module";
import { RolesModule } from "../../roles/roles.module";

export async function getUsersTestingModule(): Promise<TestingModule> {
     return await Test.createTestingModule({
        imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                TypeORMPostgresTestingModule([User, Role]),
                TypeOrmModule.forFeature([User, Role]),
                UsersModule,
                RolesModule,
              ],
              controllers: [UsersController],
              providers: [],
}).compile()};