import { forwardRef, Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entities';
import { UserModule } from '../users/user.module';
import { RoleFactory } from './entities/role.factory';
import { RoleBuilder } from './role.builder';
import { RoleTestUtil } from './utils/role-test.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    forwardRef(() => UserModule),
  ],
  controllers: [RoleController,],
  providers: [RoleService, RoleFactory, RoleBuilder, RoleTestUtil],
  exports: [RoleService, RoleTestUtil],
})
export class RoleModule {}
