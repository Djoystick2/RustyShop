import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GiveawayWheel } from "../components/giveaway/GiveawayWheel";
import {
  buildGiveawayWheelSegments,
  computeSpinTargetRotation,
  pickWinningSegmentIndex
} from "../domain/giveaway/wheel";
import { useAppContext } from "../context/AppContext";

const sessionStatusLabel: Record<string, string> = {
  draft: "Черновик",
  active: "Активна",
  completed: "Завершена"
};

export function GiveawayPage() {
  const {
    isAdmin,
    state,
    isSaving,
    runGiveawaySpin,
    updateGiveawaySessionStatus
  } = useAppContext();
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [winnerNickname, setWinnerNickname] = useState("");
  const [spinDurationSec, setSpinDurationSec] = useState(6);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastResultId, setLastResultId] = useState<string | null>(null);
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

  useEffect(
    () => () => {
      if (pendingTimeout.current) {
        window.clearTimeout(pendingTimeout.current);
      }
    },
    []
  );

  const selectedSession = state.giveawaySessions.find((session) => session.id === selectedSessionId) ?? null;
  const sessionItems = useMemo(
    () => state.giveawayItems.filter((item) => item.sessionId === selectedSession?.id),
    [selectedSession?.id, state.giveawayItems]
  );
  const sessionResults = useMemo(
    () =>
      state.giveawayResults
        .filter((result) => result.sessionId === selectedSession?.id)
        .sort((a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime()),
    [selectedSession?.id, state.giveawayResults]
  );
  const remainingItems = useMemo(
    () => sessionItems.filter((item) => item.isActive),
    [sessionItems]
  );
  const wheelSegments = useMemo(
    () => buildGiveawayWheelSegments(remainingItems, state.products),
    [remainingItems, state.products]
  );
  const lastResult = sessionResults.find((result) => result.id === lastResultId) ?? null;

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    if (!isSpinning && sessionResults.length > 0) {
      setLastResultId(sessionResults[0].id);
    }
  }, [isSpinning, selectedSession, sessionResults]);

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

    const segmentIndex = pickWinningSegmentIndex(wheelSegments.length);
    const winnerSegment = wheelSegments[segmentIndex];
    const spinDurationMs = Math.max(2000, Math.min(12000, spinDurationSec * 1000));
    const targetRotation = computeSpinTargetRotation(
      wheelRotation,
      segmentIndex,
      wheelSegments.length,
      spinDurationMs
    );

    setIsSpinning(true);
    setWheelRotation(targetRotation);
    setLastResultId(null);

    pendingTimeout.current = window.setTimeout(() => {
      void (async () => {
        await runGiveawaySpin({
          sessionId: selectedSession.id,
          giveawayItemId: winnerSegment.giveawayItemId,
          productId: winnerSegment.productId,
          winnerNickname: winnerNickname.trim() || "без ника",
          spinDurationMs,
          note: "Wheel spin"
        });
        setIsSpinning(false);
        setWinnerNickname("");
      })();
    }, spinDurationMs + 80);
  }

  if (!state.giveawaySessions.length) {
    return (
      <div className="page stack-lg">
        <section className="card empty-state">
          <h1>Розыгрыш</h1>
          <p>Пока нет сессий розыгрыша. Создайте первую сессию в админке.</p>
          {isAdmin ? (
            <Link className="btn btn_secondary" to="/profile">
              Открыть админку
            </Link>
          ) : null}
        </section>
      </div>
    );
  }

  if (!selectedSession) {
    return null;
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
          Статус: {sessionStatusLabel[selectedSession.status]} · Дата:{" "}
          {new Date(selectedSession.drawAt).toLocaleString("ru-RU")}
        </small>
        <p>{selectedSession.description}</p>
      </section>

      <section className="card giveaway-board">
        <GiveawayWheel
          segments={wheelSegments}
          rotationDeg={wheelRotation}
          spinDurationMs={spinDurationSec * 1000}
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
                  max={12}
                  value={spinDurationSec}
                  onChange={(event) => setSpinDurationSec(Number(event.target.value) || 6)}
                  disabled={isSpinning}
                />
              </label>
              <div className="toolbar">
                <button
                  type="button"
                  className="btn btn_primary"
                  onClick={() => void handleSpin()}
                  disabled={
                    isSpinning ||
                    isSaving("giveaway") ||
                    remainingItems.length === 0 ||
                    selectedSession.status !== "active"
                  }
                >
                  {isSpinning ? "Вращаем..." : "Запустить спин"}
                </button>
                <button
                  type="button"
                  className="btn btn_secondary"
                  onClick={() => void updateGiveawaySessionStatus(selectedSession.id, "active")}
                  disabled={isSpinning || isSaving("giveaway") || selectedSession.status === "active"}
                >
                  Сделать активной
                </button>
                <button
                  type="button"
                  className="btn btn_secondary"
                  onClick={() => void updateGiveawaySessionStatus(selectedSession.id, "completed")}
                  disabled={isSpinning || isSaving("giveaway") || selectedSession.status === "completed"}
                >
                  Завершить
                </button>
              </div>
              {selectedSession.status !== "active" ? (
                <small>Для запуска спина переведите сессию в статус «Активна».</small>
              ) : null}
            </div>
          ) : (
            <p>Запуск спина доступен только администратору.</p>
          )}

          {remainingItems.length === 0 ? (
            <p className="giveaway-finish">Лоты закончились. Сессия завершена.</p>
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
        <h2 className="section-title">Текущие лоты</h2>
        {remainingItems.length === 0 ? (
          <p>Активных лотов не осталось.</p>
        ) : (
          remainingItems.map((item) => {
            const product = state.products.find((candidate) => candidate.id === item.productId);
            return (
              <div key={item.id} className="row-between">
                <span>{product?.title ?? "Удалённый товар"}</span>
                <small>слотов: {item.slots}</small>
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
                  <strong>{product?.title ?? "Удалённый товар"}</strong>
                  <small>{new Date(result.wonAt).toLocaleString("ru-RU")}</small>
                </div>
                <small>{result.winnerNickname || "без ника"}</small>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
