import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeORMPostgresTestingModule } from '../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { UserBuilder } from './builders/user.builder';
import { UserController } from './controllers/user.controller';
import { User } from './entities/user.entities';
import { UserService } from './services/user.service';
import { UserChangeDetector } from './utils/change-detectors/user.change-detector';
import { UserTestUtil } from './utils/user-test.util';
import { UserValidator } from './validators/user.validator';

@Module({
  imports: [
    TypeORMPostgresTestingModule([]),
    TypeOrmModule.forFeature([User, Tenant]),
    TenantsModule,
    CacheModule.register(),
    AppLoggingModule,
    RequestContextModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserBuilder, UserValidator, UserTestUtil, UserChangeDetector],
  exports: [UserService, UserTestUtil, TypeOrmModule],
})
export class UserModule {}
