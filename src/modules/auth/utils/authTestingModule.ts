import { ConfigModule, ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { User } from "../../users/entities/user.entities";
import { Role } from "../../roles/entities/role.entities";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import { RoleFactory } from "../../roles/entities/role.factory";
import { UserFactory } from "../../users/entities/user.factory";

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
                  })
            ],
            controllers: [AuthController],
            providers: [AuthService, ConfigService, RoleFactory, UserFactory],
}).compile()};