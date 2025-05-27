import { ConfigModule, ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "../../users/user.module";
import { AuthModule } from "../auth.module";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { LoggerModule } from "nestjs-pino";
import { AppLoggingModule } from "../../app-logging/app-logging.module";
import { RequestContextModule } from "../../request-context/request-context.module";
import { RequestContextService } from "../../request-context/RequestContextService";
import { TestRequestContextService } from "../../../util/mocks/test-request-context.service";

export async function getAuthTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),

            JwtModule.registerAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: async (configService: ConfigService) => ({
                    global: true,
                    secret: configService.get<string>('JWT_SECRET'),
                    signOptions: { expiresIn: '60s' },
                }),
            }),

            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } }
            }),

            AuthModule,
            AppLoggingModule,
            RequestContextModule,
            UserModule
        ],

        controllers: [AuthController],

        providers: [AuthService,],
    }).overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .compile()
};