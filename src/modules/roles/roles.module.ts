import { forwardRef, Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entities';
import { UsersModule } from '../users/users.module';
import { RoleFactory } from './entities/role.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    forwardRef(() => UsersModule),
  ],
  controllers: [RolesController,],
  providers: [RolesService, RoleFactory],
  exports: [RolesService],
})
export class RolesModule {}
