import { requireOptionalNativeModule } from "expo-modules-core";
// null ב-Expo Go או בפלטפורמה שאין בה את המודול
export default requireOptionalNativeModule("MashovListener");
