import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { GiveawayWheel } from "../components/giveaway/GiveawayWheel";
import {
  buildGiveawayWheelSegments,
  computeSpinTargetRotation,
  pickWinningSegmentIndex
} from "../domain/giveaway/wheel";
import { useAppContext } from "../context/AppContext";
import type { GiveawaySessionStatus } from "../types/entities";

const sessionStatusLabel: Record<GiveawaySessionStatus, string> = {
  draft: "Черновик",
  active: "Активна",
  completed: "Завершена"
};

function normalizeSpinDuration(value: string | number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 6;
  }
  return Math.max(2, Math.min(180, Math.round(parsed)));
}

function sessionDurationToSeconds(spinDurationMs: number | null | undefined): number {
  if (typeof spinDurationMs !== "number" || !Number.isFinite(spinDurationMs)) {
    return 6;
  }
  return normalizeSpinDuration(Math.round(spinDurationMs / 1000));
}

export function GiveawayPage() {
  const {
    isAdmin,
    state,
    isSaving,
    createGiveawaySession,
    updateGiveawaySession,
    updateGiveawaySessionStatus,
    attachProductToGiveaway,
    removeGiveawayItem,
    runGiveawaySpin
  } = useAppContext();

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [winnerNickname, setWinnerNickname] = useState("");
  const [spinDurationInput, setSpinDurationInput] = useState("6");
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastResultId, setLastResultId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [lotProductId, setLotProductId] = useState("");
  const [sessionForm, setSessionForm] = useState({
    id: "",
    title: "",
    description: "",
    drawAt: "",
    status: "draft" as GiveawaySessionStatus
  });
  const pendingTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (!state.giveawaySessions.length) {
      setSelectedSessionId("");
      return;
    }

    const active = state.giveawaySessions.find((session) => session.status === "active");
    if (!selectedSessionId) {
      setSelectedSessionId(active?.id ?? state.giveawaySessions[0].id);
      return;
    }

    const exists = state.giveawaySessions.some((session) => session.id === selectedSessionId);
    if (!exists) {
      setSelectedSessionId(active?.id ?? state.giveawaySessions[0].id);
    }
  }, [selectedSessionId, state.giveawaySessions]);

  useEffect(() => {
    if (!lotProductId && state.products.length > 0) {
      setLotProductId(state.products[0].id);
    }
  }, [lotProductId, state.products]);

  useEffect(
    () => () => {
      if (pendingTimeout.current) {
        window.clearTimeout(pendingTimeout.current);
      }
    },
    []
  );

  const selectedSession = state.giveawaySessions.find((session) => session.id === selectedSessionId) ?? null;

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    setSpinDurationInput(String(sessionDurationToSeconds(selectedSession.spinDurationMs)));
  }, [selectedSession?.id, selectedSession?.spinDurationMs]);

  const sessionItems = useMemo(
    () => state.giveawayItems.filter((item) => item.sessionId === selectedSession?.id),
    [selectedSession?.id, state.giveawayItems]
  );
  const remainingItems = useMemo(() => sessionItems.filter((item) => item.isActive), [sessionItems]);
  const sessionResults = useMemo(
    () =>
      state.giveawayResults
        .filter((result) => result.sessionId === selectedSession?.id)
        .sort((a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime()),
    [selectedSession?.id, state.giveawayResults]
  );
  const wheelSegments = useMemo(
    () => buildGiveawayWheelSegments(remainingItems, state.products),
    [remainingItems, state.products]
  );
  const lastResult = sessionResults.find((result) => result.id === lastResultId) ?? null;

  const availableProductsForLot = useMemo(() => {
    const existing = new Set(sessionItems.map((item) => item.productId));
    return state.products
      .filter((product) => product.status !== "sold_out")
      .filter((product) => !existing.has(product.id));
  }, [sessionItems, state.products]);

  useEffect(() => {
    if (!selectedSession) {
      return;
    }
    if (!isSpinning && sessionResults.length > 0) {
      setLastResultId(sessionResults[0].id);
    }
  }, [isSpinning, selectedSession, sessionResults]);

  async function persistSpinDuration(): Promise<boolean> {
    if (!isAdmin || !selectedSession) {
      return false;
    }

    const spinDurationSec = normalizeSpinDuration(spinDurationInput);
    setSpinDurationInput(String(spinDurationSec));
    const spinDurationMs = spinDurationSec * 1000;

    if (spinDurationMs === selectedSession.spinDurationMs) {
      return true;
    }

    const ok = await updateGiveawaySession(selectedSession.id, {
      spinDurationMs
    });

    if (ok) {
      setNotice("Длительность вращения сохранена.");
    }

    return ok;
  }

  async function submitSession(event: FormEvent) {
    event.preventDefault();
    if (!sessionForm.title.trim() || !sessionForm.drawAt) {
      return;
    }

    setNotice("");

    if (sessionForm.id) {
      const ok = await updateGiveawaySession(sessionForm.id, {
        title: sessionForm.title.trim(),
        description: sessionForm.description.trim(),
        drawAt: new Date(sessionForm.drawAt).toISOString(),
        status: sessionForm.status
      });

      if (!ok) {
        return;
      }

      setNotice("Сессия обновлена.");
    } else {
      const ok = await createGiveawaySession({
        title: sessionForm.title.trim(),
        description: sessionForm.description.trim(),
        drawAt: new Date(sessionForm.drawAt).toISOString(),
        spinDurationMs: normalizeSpinDuration(spinDurationInput) * 1000
      });

      if (!ok) {
        return;
      }

      setNotice("Сессия создана.");
    }

    setSessionForm({ id: "", title: "", description: "", drawAt: "", status: "draft" });
  }

  async function handleActivateSession() {
    if (!selectedSession) {
      return;
    }
    if (remainingItems.length === 0) {
      setNotice("Нельзя открыть сессию без лотов.");
      return;
    }

    setNotice("");
    const currentlyActive = state.giveawaySessions.find(
      (session) => session.status === "active" && session.id !== selectedSession.id
    );

    if (currentlyActive) {
      const demoted = await updateGiveawaySessionStatus(currentlyActive.id, "draft");
      if (!demoted) {
        return;
      }
    }

    const activated = await updateGiveawaySessionStatus(selectedSession.id, "active");
    if (activated) {
      setNotice("Сессия открыта и готова к спину.");
    }
  }

  async function handleMoveToDraft() {
    if (!selectedSession) {
      return;
    }

    setNotice("");
    const ok = await updateGiveawaySessionStatus(selectedSession.id, "draft");
    if (ok) {
      setNotice("Сессия переведена в черновик.");
    }
  }

  async function handleFinishSession() {
    if (!selectedSession) {
      return;
    }

    setNotice("");
    const ok = await updateGiveawaySessionStatus(selectedSession.id, "completed");
    if (ok) {
      setNotice("Сессия завершена.");
    }
  }

  async function handleAddLot() {
    if (!selectedSession || !lotProductId) {
      return;
    }

    setNotice("");
    const ok = await attachProductToGiveaway(selectedSession.id, lotProductId);
    if (ok) {
      setNotice("Лот добавлен в сессию.");
    }
  }

  async function handleRemoveLot(itemId: string) {
    setNotice("");
    const ok = await removeGiveawayItem(itemId);
    if (ok) {
      setNotice("Лот удален из сессии.");
    }
  }

  async function handleSpin() {
    if (
      !isAdmin ||
      !selectedSession ||
      selectedSession.status !== "active" ||
      isSpinning ||
      isSaving("giveaway") ||
      wheelSegments.length === 0
    ) {
      return;
    }

    const durationSaved = await persistSpinDuration();
    if (!durationSaved) {
      return;
    }

    const spinDurationSec = normalizeSpinDuration(spinDurationInput);
    const segmentIndex = pickWinningSegmentIndex(wheelSegments.length);
    const winnerSegment = wheelSegments[segmentIndex];
    const spinDurationMs = spinDurationSec * 1000;
    const targetRotation = computeSpinTargetRotation(
      wheelRotation,
      segmentIndex,
      wheelSegments.length,
      spinDurationMs
    );

    setIsSpinning(true);
    setWheelRotation(targetRotation);
    setLastResultId(null);
    setNotice("");

    pendingTimeout.current = window.setTimeout(() => {
      void (async () => {
        const ok = await runGiveawaySpin({
          sessionId: selectedSession.id,
          giveawayItemId: winnerSegment.giveawayItemId,
          productId: winnerSegment.productId,
          winnerNickname: winnerNickname.trim() || "без ника",
          spinDurationMs,
          note: "Wheel spin"
        });

        setIsSpinning(false);

        if (ok) {
          setWinnerNickname("");
          setNotice("Спин завершен, результат сохранен.");
        }
      })();
    }, spinDurationMs + 80);
  }

  if (!state.giveawaySessions.length) {
    return (
      <div className="page stack-lg">
        <section className="card empty-state">
          <h1>Розыгрыш</h1>
          <p>Пока нет сессий розыгрыша. Создайте первую сессию в профиле администратора.</p>
          {isAdmin ? (
            <Link className="btn btn_secondary" to="/profile">
              Открыть админ-профиль
            </Link>
          ) : null}
        </section>
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="page">
        <section className="card empty-state">
          <h1>Розыгрыш недоступен</h1>
          <p>Не удалось выбрать сессию.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page stack-lg">
      <section className="card stack">
        <h1>Розыгрыш</h1>
        <label className="field">
          <span>Сессия</span>
          <select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}>
            {state.giveawaySessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title} · {sessionStatusLabel[session.status]}
              </option>
            ))}
          </select>
        </label>
        <small>
          Статус: {sessionStatusLabel[selectedSession.status]} · Дата: {" "}
          {new Date(selectedSession.drawAt).toLocaleString("ru-RU")} · Длительность: {" "}
          {sessionDurationToSeconds(selectedSession.spinDurationMs)} сек
        </small>
        <p>{selectedSession.description}</p>

        {isAdmin ? (
          <div className="toolbar">
            {selectedSession.status === "active" ? (
              <button
                type="button"
                className="btn btn_secondary"
                disabled={isSaving("giveaway") || isSpinning}
                aria-busy={isSaving("giveaway")}
                onClick={() => void handleMoveToDraft()}
              >
                Вернуть в черновик
              </button>
            ) : (
              <button
                type="button"
                className="btn btn_primary"
                disabled={isSaving("giveaway") || isSpinning || remainingItems.length === 0}
                aria-busy={isSaving("giveaway")}
                onClick={() => void handleActivateSession()}
              >
                Открыть сессию
              </button>
            )}
            <button
              type="button"
              className="btn btn_secondary"
              disabled={isSaving("giveaway") || isSpinning || selectedSession.status === "completed"}
              aria-busy={isSaving("giveaway")}
              onClick={() => void handleFinishSession()}
            >
              Завершить
            </button>
          </div>
        ) : null}
      </section>

      {isAdmin ? (
        <section className="card stack">
          <h2 className="section-title">{sessionForm.id ? "Редактирование сессии" : "Новая сессия"}</h2>
          <form className="stack" onSubmit={(event) => void submitSession(event)}>
            <label className="field">
              <span>Название</span>
              <input
                value={sessionForm.title}
                onChange={(event) => setSessionForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Описание</span>
              <textarea
                rows={2}
                value={sessionForm.description}
                onChange={(event) =>
                  setSessionForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Дата розыгрыша</span>
              <input
                type="datetime-local"
                value={sessionForm.drawAt}
                onChange={(event) => setSessionForm((prev) => ({ ...prev, drawAt: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Статус</span>
              <select
                value={sessionForm.status}
                onChange={(event) =>
                  setSessionForm((prev) => ({ ...prev, status: event.target.value as GiveawaySessionStatus }))
                }
              >
                <option value="draft">Черновик</option>
                <option value="active">Активна</option>
                <option value="completed">Завершена</option>
              </select>
            </label>
            <div className="toolbar">
              <button
                className="btn btn_primary"
                type="submit"
                disabled={isSaving("giveaway")}
                aria-busy={isSaving("giveaway")}
              >
                {sessionForm.id ? "Сохранить сессию" : "Создать сессию"}
              </button>
              {sessionForm.id ? (
                <button
                  type="button"
                  className="btn btn_secondary"
                  onClick={() =>
                    setSessionForm({ id: "", title: "", description: "", drawAt: "", status: "draft" })
                  }
                >
                  Сбросить
                </button>
              ) : null}
            </div>
          </form>

          <div className="admin-list">
            {state.giveawaySessions.map((session) => (
              <article key={session.id} className="admin-item">
                <div>
                  <strong>{session.title}</strong>
                  <p>{sessionStatusLabel[session.status]}</p>
                  <small>{new Date(session.drawAt).toLocaleString("ru-RU")}</small>
                </div>
                <div className="toolbar">
                  <button
                    type="button"
                    className="btn btn_secondary"
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    Выбрать
                  </button>
                  <button
                    type="button"
                    className="btn btn_secondary"
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setSessionForm({
                        id: session.id,
                        title: session.title,
                        description: session.description,
                        drawAt: session.drawAt.slice(0, 16),
                        status: session.status
                      });
                    }}
                  >
                    Редактировать
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card giveaway-board">
        <GiveawayWheel
          segments={wheelSegments}
          rotationDeg={wheelRotation}
          spinDurationMs={normalizeSpinDuration(spinDurationInput) * 1000}
          isSpinning={isSpinning}
        />
        <div className="giveaway-side stack">
          <div className="giveaway-counts">
            <p>
              В розыгрыше: <strong>{remainingItems.length}</strong>
            </p>
            <p>
              Уже выпало: <strong>{sessionResults.length}</strong>
            </p>
          </div>

          {isAdmin ? (
            <div className="stack">
              <label className="field">
                <span>Ник подписчика</span>
                <input
                  value={winnerNickname}
                  onChange={(event) => setWinnerNickname(event.target.value)}
                  placeholder="@nickname"
                  disabled={isSpinning}
                />
              </label>
              <label className="field">
                <span>Длительность вращения (сек.)</span>
                <input
                  type="number"
                  min={2}
                  max={180}
                  value={spinDurationInput}
                  onChange={(event) => setSpinDurationInput(event.target.value)}
                  onBlur={() => {
                    void persistSpinDuration();
                  }}
                  disabled={isSpinning || isSaving("giveaway")}
                />
              </label>
              <button
                type="button"
                className="btn btn_secondary"
                onClick={() => void persistSpinDuration()}
                disabled={isSpinning || isSaving("giveaway")}
                aria-busy={isSaving("giveaway")}
              >
                Сохранить длительность
              </button>
              <button
                type="button"
                className="btn btn_primary"
                onClick={() => void handleSpin()}
                aria-busy={isSpinning || isSaving("giveaway")}
                disabled={
                  isSpinning ||
                  isSaving("giveaway") ||
                  remainingItems.length === 0 ||
                  selectedSession.status !== "active"
                }
              >
                {isSpinning ? "Вращаем..." : "Запустить спин"}
              </button>
              {selectedSession.status !== "active" ? (
                <small>Для спина откройте выбранную сессию.</small>
              ) : null}
            </div>
          ) : (
            <p>Запуск спина доступен только администратору.</p>
          )}

          {remainingItems.length === 0 ? (
            <p className="giveaway-finish">Лоты закончились. Сессию можно завершить.</p>
          ) : null}
          {lastResult ? (
            <div className="card giveaway-win">
              <h3>Победный лот</h3>
              <p>{state.products.find((product) => product.id === lastResult.productId)?.title ?? "Лот"}</p>
              <small>Победитель: {lastResult.winnerNickname || "не указан"}</small>
            </div>
          ) : null}
        </div>
      </section>

      <section className="card stack">
        <h2 className="section-title">Лоты сессии</h2>
        {isAdmin ? (
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              void handleAddLot();
            }}
          >
            <label className="field">
              <span>Добавить товар в лоты</span>
              <select value={lotProductId} onChange={(event) => setLotProductId(event.target.value)}>
                {availableProductsForLot.length === 0 ? (
                  <option value="">Нет доступных товаров</option>
                ) : (
                  availableProductsForLot.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))
                )}
              </select>
            </label>
            <button
              className="btn btn_secondary"
              type="submit"
              aria-busy={isSaving("giveaway")}
              disabled={
                !lotProductId ||
                availableProductsForLot.length === 0 ||
                isSaving("giveaway") ||
                selectedSession.status === "completed"
              }
            >
              Добавить лот
            </button>
          </form>
        ) : null}

        {sessionItems.length === 0 ? (
          <p>Лотов пока нет.</p>
        ) : (
          sessionItems.map((item) => {
            const product = state.products.find((candidate) => candidate.id === item.productId);
            return (
              <div key={item.id} className="row-between">
                <div className="stack-sm">
                  <strong>{product?.title ?? "Удаленный товар"}</strong>
                  <small>{item.isActive ? "В розыгрыше" : "Уже выпал"}</small>
                </div>
                {isAdmin ? (
                  <button
                    type="button"
                    className="btn btn_ghost"
                    aria-busy={isSaving("giveaway")}
                    disabled={
                      isSaving("giveaway") ||
                      isSpinning ||
                      selectedSession.status === "completed" ||
                      !item.isActive
                    }
                    onClick={() => void handleRemoveLot(item.id)}
                  >
                    Удалить
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </section>

      <section className="card stack">
        <h2 className="section-title">Уже разыграны</h2>
        {sessionResults.length === 0 ? (
          <p>Пока нет результатов.</p>
        ) : (
          sessionResults.map((result) => {
            const product = state.products.find((candidate) => candidate.id === result.productId);
            return (
              <div key={result.id} className="row-between">
                <div className="stack-sm">
                  <strong>{product?.title ?? "Удаленный товар"}</strong>
                  <small>{new Date(result.wonAt).toLocaleString("ru-RU")}</small>
                </div>
                <small>{result.winnerNickname || "без ника"}</small>
              </div>
            );
          })
        )}
      </section>

      {notice ? (
        <section className="mode-banner mode-banner_compact">
          <span>{notice}</span>
        </section>
      ) : null}
    </div>
  );
}
