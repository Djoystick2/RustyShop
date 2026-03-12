import {
  getRepositoryUnavailableReason,
  resolveRepositoryRuntimeMode
} from "../../config/runtime";
import { createLocalRepository } from "./local-repository";
import { createSupabaseRepository } from "./supabase-repository";
import { createUnavailableRepository } from "./unavailable-repository";

export function createRepository() {
  const mode = resolveRepositoryRuntimeMode();

  if (mode === "supabase") {
    return createSupabaseRepository();
  }

  if (mode === "local_fallback") {
    return createLocalRepository();
  }

  return createUnavailableRepository(getRepositoryUnavailableReason());
}

