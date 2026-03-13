import { type FormEvent, useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";

export function AdminPanel() {
  const { state, isSaving, updateSellerSettings, updateStoreSettings } = useAppContext();

  const [brandForm, setBrandForm] = useState({
    storeName: state.storeSettings.storeName,
    brandSlogan: state.storeSettings.brandSlogan,
    heroBadge: state.storeSettings.heroBadge
  });
  const [sellerForm, setSellerForm] = useState({
    sellerName: state.sellerSettings.sellerName,
    shortBio: state.sellerSettings.shortBio,
    contactText: state.sellerSettings.contactText,
    purchaseButtonLabel: state.sellerSettings.purchaseButtonLabel,
    city: state.sellerSettings.city
  });

  useEffect(() => {
    setBrandForm({
      storeName: state.storeSettings.storeName,
      brandSlogan: state.storeSettings.brandSlogan,
      heroBadge: state.storeSettings.heroBadge
    });
  }, [state.storeSettings.brandSlogan, state.storeSettings.heroBadge, state.storeSettings.storeName]);

  useEffect(() => {
    setSellerForm({
      sellerName: state.sellerSettings.sellerName,
      shortBio: state.sellerSettings.shortBio,
      contactText: state.sellerSettings.contactText,
      purchaseButtonLabel: state.sellerSettings.purchaseButtonLabel,
      city: state.sellerSettings.city
    });
  }, [
    state.sellerSettings.city,
    state.sellerSettings.contactText,
    state.sellerSettings.purchaseButtonLabel,
    state.sellerSettings.sellerName,
    state.sellerSettings.shortBio
  ]);

  async function submitBrand(event: FormEvent) {
    event.preventDefault();
    await updateStoreSettings({
      storeName: brandForm.storeName,
      brandSlogan: brandForm.brandSlogan,
      heroBadge: brandForm.heroBadge
    });
  }

  async function submitSeller(event: FormEvent) {
    event.preventDefault();
    await updateSellerSettings({
      sellerName: sellerForm.sellerName,
      shortBio: sellerForm.shortBio,
      contactText: sellerForm.contactText,
      purchaseButtonLabel: sellerForm.purchaseButtonLabel,
      city: sellerForm.city
    });
  }

  return (
    <section className="admin-panel stack">
      <article className="card stack-sm admin-panel__card">
        <div className="stack-sm">
          <p className="hero__eyebrow">Storefront тексты</p>
          <h3>Бренд и первая подача</h3>
          <p className="admin-panel__helper">
            Эти поля управляют названием магазина, слоганом и короткой подписью hero-блока.
          </p>
        </div>

        <form className="admin-panel__form stack" onSubmit={(event) => void submitBrand(event)}>
          <div className="admin-panel__grid">
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
          </div>

          <label className="field">
            <span>Hero badge</span>
            <input
              value={brandForm.heroBadge}
              onChange={(event) => setBrandForm((prev) => ({ ...prev, heroBadge: event.target.value }))}
            />
          </label>

          <div className="admin-panel__actions">
            <button
              className="btn btn_primary"
              type="submit"
              disabled={isSaving("settings_store")}
              aria-busy={isSaving("settings_store")}
            >
              {isSaving("settings_store") ? "Сохраняем..." : "Сохранить бренд"}
            </button>
          </div>
        </form>
      </article>

      <article className="card stack-sm admin-panel__card">
        <div className="stack-sm">
          <p className="hero__eyebrow">Коммуникация</p>
          <h3>Тексты продавца и покупка</h3>
          <p className="admin-panel__helper">
            Здесь настраиваются подписи, контактный текст и label кнопки покупки в пользовательском сценарии.
          </p>
        </div>

        <form className="admin-panel__form stack" onSubmit={(event) => void submitSeller(event)}>
          <div className="admin-panel__grid">
            <label className="field">
              <span>Имя продавца</span>
              <input
                value={sellerForm.sellerName}
                onChange={(event) => setSellerForm((prev) => ({ ...prev, sellerName: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Город</span>
              <input
                value={sellerForm.city}
                onChange={(event) => setSellerForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </label>
          </div>

          <label className="field">
            <span>Короткое описание</span>
            <textarea
              rows={2}
              value={sellerForm.shortBio}
              onChange={(event) => setSellerForm((prev) => ({ ...prev, shortBio: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Контактный текст</span>
            <textarea
              rows={3}
              value={sellerForm.contactText}
              onChange={(event) => setSellerForm((prev) => ({ ...prev, contactText: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Текст кнопки покупки</span>
            <input
              value={sellerForm.purchaseButtonLabel}
              onChange={(event) =>
                setSellerForm((prev) => ({ ...prev, purchaseButtonLabel: event.target.value }))
              }
            />
          </label>

          <div className="admin-panel__actions">
            <button
              className="btn btn_primary"
              type="submit"
              disabled={isSaving("settings_seller")}
              aria-busy={isSaving("settings_seller")}
            >
              {isSaving("settings_seller") ? "Сохраняем..." : "Сохранить тексты"}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
