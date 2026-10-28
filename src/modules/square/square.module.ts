import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderCategory } from '../orders/entities/order-category.entity';
import { RequestContextModule } from '../request-context/request-context.module';
import { SquareClientFactory } from './client/square-client.factory';
import { SquareConnectionController } from './controllers/square-connection.controller';
import { SquareOAuthCallbackController } from './controllers/square-oauth-callback.controller';
import { SquareConnection } from './entities/square-connection.entity';
import { SquareOAuthState } from './entities/square-oauth-state.entity';
import { TenantAdminGuard } from './guards/tenant-admin.guard';
import { SquareConnectionService } from './services/square-connection.service';
import { SquareOAuthStateService } from './services/square-oauth-state.service';
import { SquareOAuthService } from './services/square-oauth.service';
import { SquarePostConnectService } from './services/square-post-connect.service';
import { SquareTokenCryptoService } from './services/square-token-crypto.service';
import { SquareTestUtil } from './utils/square-test.util';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SquareConnection,
            SquareOAuthState,
            OrderCategory,
        ]),
        // No default secret: SquareOAuthStateService passes its own on each call
        JwtModule.register({}),
        RequestContextModule,
    ],
    controllers: [SquareConnectionController, SquareOAuthCallbackController],
    providers: [
        SquareClientFactory,
        SquareTokenCryptoService,
        SquareConnectionService,
        SquareOAuthStateService,
        SquareOAuthService,
        SquarePostConnectService,
        TenantAdminGuard,
        SquareTestUtil,
    ],
    exports: [
        SquareClientFactory,
        SquareConnectionService,
        SquarePostConnectService,
        SquareTestUtil,
        TypeOrmModule,
    ],
})
export class SquareModule {}
