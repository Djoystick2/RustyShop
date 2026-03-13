export function StartupSplash() {
  return (
    <div className="boot-splash" role="status" aria-live="polite">
      <section className="boot-splash__card">
        <div className="boot-splash__brand">
          <div className="boot-splash__mark" aria-hidden>
            <span>RS</span>
          </div>
          <div className="boot-splash__copy">
            <p className="boot-splash__eyebrow">RustyShop</p>
            <h1 className="boot-splash__title">Собираем уютную витрину</h1>
            <p className="boot-splash__text">Товары, тексты и giveaway уже подтягиваются.</p>
          </div>
        </div>

        <div className="boot-splash__pulse" aria-hidden>
          <span />
          <span />
          <span />
        </div>

        <div className="boot-splash__skeleton" aria-hidden>
          <span className="boot-splash__line boot-splash__line_wide" />
          <span className="boot-splash__line" />
          <span className="boot-splash__line boot-splash__line_short" />
        </div>
      </section>
    </div>
  );
}
