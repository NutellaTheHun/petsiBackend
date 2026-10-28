import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestContextModule } from '../request-context/request-context.module';
import { SquareClientFactory } from './client/square-client.factory';
import { SquareConnectionController } from './controllers/square-connection.controller';
import { SquareConnection } from './entities/square-connection.entity';
import { TenantAdminGuard } from './guards/tenant-admin.guard';
import { SquareConnectionService } from './services/square-connection.service';
import { SquareTokenCryptoService } from './services/square-token-crypto.service';
import { SquareTestUtil } from './utils/square-test.util';

@Module({
    imports: [
        TypeOrmModule.forFeature([SquareConnection]),
        RequestContextModule,
    ],
    controllers: [SquareConnectionController],
    providers: [
        SquareClientFactory,
        SquareTokenCryptoService,
        SquareConnectionService,
        TenantAdminGuard,
        SquareTestUtil,
    ],
    exports: [
        SquareClientFactory,
        SquareConnectionService,
        SquareTestUtil,
        TypeOrmModule,
    ],
})
export class SquareModule {}
