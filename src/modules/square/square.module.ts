import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../locations/entities/location.entity';
import { MenuItemSize } from '../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../menu-items/entities/menu-item.entity';
import { LocationsModule } from '../locations/locations.module';
import { OrderCategory } from '../orders/entities/order-category.entity';
import { RequestContextModule } from '../request-context/request-context.module';
import { SquareClientFactory } from './client/square-client.factory';
import { SquareCatalogController } from './controllers/square-catalog.controller';
import { SquareConnectionController } from './controllers/square-connection.controller';
import { SquareLocationLinkController } from './controllers/square-location-link.controller';
import { SquareOAuthCallbackController } from './controllers/square-oauth-callback.controller';
import { SquareCategoryLink } from './entities/square-category-link.entity';
import { SquareConnection } from './entities/square-connection.entity';
import { SquareItemHint } from './entities/square-item-hint.entity';
import { SquareLocationLink } from './entities/square-location-link.entity';
import { SquareOAuthState } from './entities/square-oauth-state.entity';
import { SquareSizeAlias } from './entities/square-size-alias.entity';
import { SquareVariationLink } from './entities/square-variation-link.entity';
import { TenantAdminGuard } from './guards/tenant-admin.guard';
import { SquareCatalogDerivationService } from './services/square-catalog-derivation.service';
import { SquareCatalogSyncService } from './services/square-catalog-sync.service';
import { SquareCatalogService } from './services/square-catalog.service';
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
            SquareCategoryLink,
            SquareItemHint,
            SquareSizeAlias,
            SquareVariationLink,
            MenuItem,
            MenuItemSize,
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
        SquareCatalogController,
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
        SquareCatalogSyncService,
        SquareCatalogDerivationService,
        SquareCatalogService,
        TenantAdminGuard,
        SquareTestUtil,
    ],
    exports: [
        SquareClientFactory,
        SquareConnectionService,
        SquarePostConnectService,
        SquareLocationSyncService,
        SquareCatalogSyncService,
        SquareCatalogDerivationService,
        SquareTestUtil,
        TypeOrmModule,
    ],
})
export class SquareModule {}
