import { type FormEvent, useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";

export function AdminPanel() {
  const { state, isSaving, updateStoreSettings } = useAppContext();

  const [brandForm, setBrandForm] = useState({
    storeName: state.storeSettings.storeName,
    brandSlogan: state.storeSettings.brandSlogan,
    heroBadge: state.storeSettings.heroBadge
  });

  useEffect(() => {
    setBrandForm({
      storeName: state.storeSettings.storeName,
      brandSlogan: state.storeSettings.brandSlogan,
      heroBadge: state.storeSettings.heroBadge
    });
  }, [state.storeSettings.brandSlogan, state.storeSettings.heroBadge, state.storeSettings.storeName]);

  async function submitBrand(event: FormEvent) {
    event.preventDefault();
    await updateStoreSettings({
      storeName: brandForm.storeName,
      brandSlogan: brandForm.brandSlogan,
      heroBadge: brandForm.heroBadge
    });
  }

  return (
    <section className="admin-panel stack">
      <form className="stack" onSubmit={(event) => void submitBrand(event)}>
        <label className="field">
          <span>Название бренда</span>
          <input
            value={brandForm.storeName}
            onChange={(event) => setBrandForm((prev) => ({ ...prev, storeName: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>Слоган</span>
          <input
            value={brandForm.brandSlogan}
            onChange={(event) => setBrandForm((prev) => ({ ...prev, brandSlogan: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>Hero badge</span>
          <input
            value={brandForm.heroBadge}
            onChange={(event) => setBrandForm((prev) => ({ ...prev, heroBadge: event.target.value }))}
          />
        </label>
        <button
          className="btn btn_primary"
          type="submit"
          disabled={isSaving("settings_store")}
          aria-busy={isSaving("settings_store")}
        >
          {isSaving("settings_store") ? "Сохраняем..." : "Сохранить"}
        </button>
      </form>
    </section>
  );
}
