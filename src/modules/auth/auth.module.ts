import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { UserLocation } from '../locations/entities/user-location.entity';
import { RequestContextModule } from '../request-context/request-context.module';
import { User } from '../users/entities/user.entities';
import { UserModule } from '../users/user.module';
import { AuthController } from './controllers/auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, UserLocation]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60s' },
      }),
    }),

    AppLoggingModule,
    RequestContextModule,
    UserModule,
    FeatureFlagsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
