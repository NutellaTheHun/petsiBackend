import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { UserModule } from '../users/user.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { RequestContextModule } from '../request-context/request-context.module';

@Module({
  imports: [
    ConfigModule,
    
    JwtModule.registerAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory: async(configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60s'},
      }),
    }),

    AppLoggingModule,
    RequestContextModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
  ]
})
export class AuthModule {}
