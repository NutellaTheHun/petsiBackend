import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../locations/entities/location.entity';
import { MenuItemSize } from '../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../menu-items/entities/menu-item.entity';
import { LocationsModule } from '../locations/locations.module';
import { OrderCategory } from '../orders/entities/order-category.entity';
import { Order } from '../orders/entities/order.entity';
import { OrdersModule } from '../orders/orders.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { SquareClientFactory } from './client/square-client.factory';
import { SquareCatalogController } from './controllers/square-catalog.controller';
import { SquareConnectionController } from './controllers/square-connection.controller';
import { SquareLocationLinkController } from './controllers/square-location-link.controller';
import { SquareOrderIssueController } from './controllers/square-order-issue.controller';
import { SquareOAuthCallbackController } from './controllers/square-oauth-callback.controller';
import { SquareWebhookController } from './controllers/square-webhook.controller';
import { SquareAttentionController } from './controllers/square-attention.controller';
import { SquareUnresolvedLineController } from './controllers/square-unresolved-line.controller';
import { SquareOrderController } from './controllers/square-order.controller';
import { SquareCategoryLink } from './entities/square-category-link.entity';
import { SquareConnection } from './entities/square-connection.entity';
import { SquareItemHint } from './entities/square-item-hint.entity';
import { SquareLocationLink } from './entities/square-location-link.entity';
import { SquareModifierLink } from './entities/square-modifier-link.entity';
import { SquareOAuthState } from './entities/square-oauth-state.entity';
import { SquareOrderIssue } from './entities/square-order-issue.entity';
import { SquareOrderLink } from './entities/square-order-link.entity';
import { SquareSizeAlias } from './entities/square-size-alias.entity';
import { SquareUnresolvedLine } from './entities/square-unresolved-line.entity';
import { SquareVariationLink } from './entities/square-variation-link.entity';
import { SquareWebhookReceipt } from './entities/square-webhook-receipt.entity';
import { TenantAdminGuard } from './guards/tenant-admin.guard';
import { SquareCatalogDerivationService } from './services/square-catalog-derivation.service';
import { SquareCatalogSyncService } from './services/square-catalog-sync.service';
import { SquareCatalogMappingService } from './services/square-catalog-mapping.service';
import { SquareCatalogService } from './services/square-catalog.service';
import { SquareLineConversionService } from './services/square-line-conversion.service';
import { SquareConnectionService } from './services/square-connection.service';
import { SquareLocationImportService } from './services/square-location-import.service';
import { SquareLocationLinkService } from './services/square-location-link.service';
import { SquareLocationSyncService } from './services/square-location-sync.service';
import { SquareModifierPropagationService } from './services/square-modifier-propagation.service';
import { SquareOAuthStateService } from './services/square-oauth-state.service';
import { SquareOAuthService } from './services/square-oauth.service';
import { SquareOrderIssueService } from './services/square-order-issue.service';
import { SquareOrderIngestService } from './services/square-order-ingest.service';
import { SquarePostConnectService } from './services/square-post-connect.service';
import { SquareTokenCryptoService } from './services/square-token-crypto.service';
import { SquareTokenRefreshService } from './services/square-token-refresh.service';
import { SquareWebhookService } from './services/square-webhook.service';
import { SquareAttentionService } from './services/square-attention.service';
import { SquareUnresolvedLineService } from './services/square-unresolved-line.service';
import { SquareOrderDetachService } from './services/square-order-detach.service';
import { SquareTestUtil } from './utils/square-test.util';
import { SquareModifierLinkValidator } from './validators/square-modifier-link.validator';
import { SquareVariationLinkValidator } from './validators/square-variation-link.validator';

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
            SquareModifierLink,
            SquareOrderLink,
            SquareOrderIssue,
            SquareUnresolvedLine,
            SquareWebhookReceipt,
            Order,
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
        // OrderService: ingest writes orders through it as a system writer
        OrdersModule,
        // TenantFeatureService: the webhook checks the tenant's flag
        FeatureFlagsModule,
    ],
    controllers: [
        SquareConnectionController,
        SquareOAuthCallbackController,
        SquareLocationLinkController,
        SquareCatalogController,
        SquareWebhookController,
        SquareOrderIssueController,
        SquareUnresolvedLineController,
        SquareAttentionController,
        SquareOrderController,
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
        SquareCatalogMappingService,
        SquareLineConversionService,
        SquareVariationLinkValidator,
        SquareModifierLinkValidator,
        SquareModifierPropagationService,
        SquareOrderIngestService,
        SquareOrderIssueService,
        SquareWebhookService,
        SquareUnresolvedLineService,
        SquareAttentionService,
        SquareOrderDetachService,
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
        SquareOrderIngestService,
        SquareTestUtil,
        TypeOrmModule,
    ],
})
export class SquareModule {}
