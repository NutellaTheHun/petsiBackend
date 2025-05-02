import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { RoleModule } from '../roles/role.module';
import { TypeORMPostgresTestingModule } from '../../typeorm/configs/TypeORMPostgresTesting';
import { UserBuilder } from './builders/user.builder';
import { UserTestUtil } from './utils/user-test.util';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeORMPostgresTestingModule([]),
    TypeOrmModule.forFeature([User]),
    forwardRef(() => RoleModule),
    CacheModule.register(),
  ],
  controllers: [UserController,],
  providers: [UserService, UserBuilder, UserTestUtil],
  exports: [UserService, UserTestUtil]
})
export class UserModule {}
