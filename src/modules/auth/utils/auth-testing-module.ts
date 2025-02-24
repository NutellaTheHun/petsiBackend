import { ConfigModule, ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import { UsersService } from "../../users/users.service";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { User } from "../../users/entities/user.entities";
import { Role } from "../../roles/entities/role.entities";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesController } from "../../roles/roles.controller";
import { UsersController } from "../../users/users.controller";
import { RolesService } from "../../roles/roles.service";
import { RoleFactory } from "../../roles/entities/role.factory";
import { UserFactory } from "../../users/entities/user.factory";
import { forwardRef } from "@nestjs/common";
import { UsersModule } from "../../users/users.module";
import { RolesModule } from "../../roles/roles.module";
import { AuthModule } from "../auth.module";

export async function getAuthTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
            imports: [
                    ConfigModule.forRoot({ isGlobal: true }),
                    TypeORMPostgresTestingModule([User, Role]),
                    TypeOrmModule.forFeature([User, Role]),
                    JwtModule.registerAsync({
                          imports:[ConfigModule],
                          inject:[ConfigService],
                          useFactory: async(configService: ConfigService) => ({
                            global: true,
                            secret: configService.get<string>('JWT_SECRET'),
                            signOptions: { expiresIn: '60s'},
                          }),
                        }),
                    forwardRef(() => UsersModule),
                    forwardRef(() => RolesModule),
                    AuthModule,
                  ],
                  controllers: [AuthController],
                  providers: [AuthService],
}).compile()};