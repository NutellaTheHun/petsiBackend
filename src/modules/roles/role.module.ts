import { CacheModule } from '@nestjs/cache-manager';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { UserModule } from '../users/user.module';
import { RoleBuilder } from './builders/role.builder';
import { RoleController } from './controllers/role.controller';
import { Role } from './entities/role.entity';
import { RoleService } from './services/role.service';
import { RoleTestUtil } from './utils/role-test.util';
import { RoleValidator } from './validators/role.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([Role]),
        forwardRef(() => UserModule),
        CacheModule.register(),
        AppLoggingModule,
        RequestContextModule,
    ],
    controllers: [RoleController,],
    providers: [RoleService, RoleBuilder, RoleValidator, RoleTestUtil],
    exports: [RoleService, RoleTestUtil],
})
export class RoleModule { }
