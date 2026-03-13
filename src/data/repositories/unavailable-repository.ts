import type {
  AppRepository,
  BootstrapContext,
  UpsertProductPayload
} from "./contracts";
import type { Category, GiveawayItem, HomepageSection, Product, SellerSettings, StoreSettings } from "../../types/entities";
import type { GiveawaySessionInput, GiveawaySessionPatch } from "../state";

function fail(message: string): never {
  throw new Error(message);
}

export function createUnavailableRepository(message: string): AppRepository {
  return {
    kind: "unavailable",
    async bootstrap(_: BootstrapContext) {
      fail(message);
    },
    async reloadProfile() {
      fail(message);
    },
    async upsertCategory(_: Category) {
      fail(message);
    },
    async upsertHomepageSection(_: HomepageSection) {
      fail(message);
    },
    async deleteHomepageSection() {
      fail(message);
    },
    async upsertProduct(_: UpsertProductPayload) {
      fail(message);
    },
    async deleteProduct() {
      fail(message);
    },
    async updateProductFlags(_: string, __: Pick<Product, "isVisible" | "isAvailable" | "isGiveawayEligible" | "isFeatured">) {
      fail(message);
    },
    async updateStoreSettings(_: Partial<StoreSettings>) {
      fail(message);
    },
    async updateSellerSettings(_: Partial<SellerSettings>) {
      fail(message);
    },
    async setFavorite() {
      fail(message);
    },
    async createGiveawaySession(_: GiveawaySessionInput) {
      fail(message);
    },
    async updateGiveawaySession(_: string, __: GiveawaySessionPatch) {
      fail(message);
    },
    async updateGiveawaySessionStatus() {
      fail(message);
    },
    async saveGiveawayItem(_: GiveawayItem) {
      fail(message);
    },
    async removeGiveawayItem() {
      fail(message);
    },
    async createGiveawayResult() {
      fail(message);
    },
    async listGiveawayResults() {
      fail(message);
    }
  };
}
