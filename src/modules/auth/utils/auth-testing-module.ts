import { ConfigModule, ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import { UsersModule } from "../../users/users.module";
import { AuthModule } from "../auth.module";

export async function getAuthTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
            imports: [
                    ConfigModule.forRoot({ isGlobal: true }),
                    JwtModule.registerAsync({
                          imports:[ConfigModule],
                          inject:[ConfigService],
                          useFactory: async(configService: ConfigService) => ({
                            global: true,
                            secret: configService.get<string>('JWT_SECRET'),
                            signOptions: { expiresIn: '60s'},
                          }),
                        }),
                    AuthModule,
                    UsersModule
                  ],
                  controllers: [AuthController],
                  providers: [AuthService],
}).compile()};