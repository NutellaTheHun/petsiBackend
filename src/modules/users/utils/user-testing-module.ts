import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
import { RoleModule } from '../../roles/role.module';
import { UserController } from '../controllers/user.controller';
import { User } from '../entities/user.entities';
import { UserService } from '../services/user.service';
import { UserModule } from '../user.module';
import { UserChangeDetector } from './change-detectors/user.change-detector';

export async function getUserTestingModule(opts?: {
  userServiceClass?: new (...args: any[]) => UserService;
  userChangeDetectorClass?: new (...args: any[]) => UserChangeDetector;
}): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeORMPostgresTestingModule([User, Role]),
      TypeOrmModule.forFeature([User, Role]),
      UserModule,
      RoleModule,
      AppLoggingModule,
      RequestContextModule,
      CacheModule.register(),
      LoggerModule.forRoot({
        pinoHttp: { transport: { target: 'pino-pretty' } },
      }),
    ],
    controllers: [UserController],
    providers: [],
  })
    .overrideProvider(RequestContextService)
    .useClass(TestRequestContextService)
    .overrideProvider(UserService)
    .useClass(opts?.userServiceClass || UserService)
    .overrideProvider(UserChangeDetector)
    .useClass(opts?.userChangeDetectorClass || UserChangeDetector)
    .compile();
}
