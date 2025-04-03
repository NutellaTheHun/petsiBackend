import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/user.entities";
import { UserController } from "../user.controller";
import { ConfigModule } from "@nestjs/config";
import { Role } from "../../roles/entities/role.entities";
import { UserModule } from "../user.module";
import { RoleModule } from "../../roles/role.module";

export async function getUserTestingModule(): Promise<TestingModule> {
     return await Test.createTestingModule({
        imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                TypeORMPostgresTestingModule([User, Role]),
                TypeOrmModule.forFeature([User, Role]),
                UserModule,
                RoleModule,
              ],
              controllers: [UserController],
              providers: [],
}).compile()};