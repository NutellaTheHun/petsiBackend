import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../locations/entities/location.entity';
import { LocationsModule } from '../locations/locations.module';
import { OrderCategory } from '../orders/entities/order-category.entity';
import { RequestContextModule } from '../request-context/request-context.module';
import { SquareClientFactory } from './client/square-client.factory';
import { SquareConnectionController } from './controllers/square-connection.controller';
import { SquareLocationLinkController } from './controllers/square-location-link.controller';
import { SquareOAuthCallbackController } from './controllers/square-oauth-callback.controller';
import { SquareConnection } from './entities/square-connection.entity';
import { SquareLocationLink } from './entities/square-location-link.entity';
import { SquareOAuthState } from './entities/square-oauth-state.entity';
import { TenantAdminGuard } from './guards/tenant-admin.guard';
import { SquareConnectionService } from './services/square-connection.service';
import { SquareLocationImportService } from './services/square-location-import.service';
import { SquareLocationLinkService } from './services/square-location-link.service';
import { SquareLocationSyncService } from './services/square-location-sync.service';
import { SquareOAuthStateService } from './services/square-oauth-state.service';
import { SquareOAuthService } from './services/square-oauth.service';
import { SquarePostConnectService } from './services/square-post-connect.service';
import { SquareTokenCryptoService } from './services/square-token-crypto.service';
import { SquareTokenRefreshService } from './services/square-token-refresh.service';
import { SquareTestUtil } from './utils/square-test.util';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SquareConnection,
            SquareOAuthState,
            SquareLocationLink,
            OrderCategory,
            Location,
        ]),
        // No default secret: SquareOAuthStateService passes its own on each call
        JwtModule.register({}),
        RequestContextModule,
        // LocationService, and the cache its controller reads (see
        // SquareLocationLinkService.createLocationForCurrentTenant)
        LocationsModule,
    ],
    controllers: [
        SquareConnectionController,
        SquareOAuthCallbackController,
        SquareLocationLinkController,
    ],
    providers: [
        SquareClientFactory,
        SquareTokenCryptoService,
        SquareTokenRefreshService,
        SquareConnectionService,
        SquareOAuthStateService,
        SquareOAuthService,
        SquarePostConnectService,
        SquareLocationSyncService,
        SquareLocationLinkService,
        SquareLocationImportService,
        TenantAdminGuard,
        SquareTestUtil,
    ],
    exports: [
        SquareClientFactory,
        SquareConnectionService,
        SquarePostConnectService,
        SquareLocationSyncService,
        SquareTestUtil,
        TypeOrmModule,
    ],
})
export class SquareModule {}
