import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UserModule } from '../../users/user.module';
import { AuthModule } from '../auth.module';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

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
        pinoHttp: { transport: { target: 'pino-pretty' } },
      }),

      AuthModule,
      AppLoggingModule,
      RequestContextModule,
      UserModule,
    ],

    controllers: [AuthController],

    providers: [AuthService],
  })
    .overrideProvider(RequestContextService)
    .useClass(TestRequestContextService)
    .compile();
}
