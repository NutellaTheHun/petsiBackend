import { SetMetadata } from "@nestjs/common";
import { Feature } from "../../modules/feature-flags/utils/feature.registry";

export const FEATURES_KEY = 'features';
export const RequiresFeature = (...features: Feature[]) => SetMetadata(FEATURES_KEY, features);
