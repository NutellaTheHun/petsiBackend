import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../users/user.module';
import { RoleBuilder } from './builders/role.builder';
import { RoleController } from './controllers/role.controller';
import { Role } from './entities/role.entity';
import { RoleService } from './services/role.service';
import { RoleTestUtil } from './utils/role-test.util';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';
import { RoleValidator } from './validators/role.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    forwardRef(() => UserModule),
    CacheModule.register(),
    LoggerModule,
  ],
  controllers: [RoleController,],
  providers: [RoleService, RoleBuilder, RoleValidator, RoleTestUtil],
  exports: [RoleService, RoleTestUtil],
})
export class RoleModule {}
