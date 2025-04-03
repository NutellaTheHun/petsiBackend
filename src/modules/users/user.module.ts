import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { RoleModule } from '../roles/role.module';
import { UserFactory } from './entities/user.factory';
import { TypeORMPostgresTestingModule } from '../../typeorm/configs/TypeORMPostgresTesting';
import { UserBuilder } from './user.builder';
import { UserTestUtil } from './utils/user-test.util';

@Module({
  imports: [
    TypeORMPostgresTestingModule([]),
    TypeOrmModule.forFeature([User]),
    forwardRef(() => RoleModule),
  ],
  controllers: [UserController,],
  providers: [UserService, UserFactory, UserBuilder, UserTestUtil],
  exports: [UserService, UserTestUtil]
})
export class UserModule {}
