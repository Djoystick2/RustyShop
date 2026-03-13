const splashImage = new URL("../../../loadpage.png", import.meta.url).href;

export function StartupSplash() {
  return (
    <div className="boot-splash" role="status" aria-live="polite">
      <img className="boot-splash__image" src={splashImage} alt="" aria-hidden />
      <div className="boot-splash__overlay" aria-hidden />
      <section className="boot-splash__footer">
        <div className="boot-splash__loading" aria-label="Загрузка">
          <span>Загрузка</span>
          <span className="boot-splash__dots" aria-hidden>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      </section>
    </div>
  );
}
