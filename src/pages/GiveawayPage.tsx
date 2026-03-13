import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { GiveawayWheel } from "../components/giveaway/GiveawayWheel";
import { useAppContext } from "../context/AppContext";
import {
  buildGiveawayWheelSegments,
  computeSpinTargetRotation,
  listProductsAvailableForGiveawaySession,
  pickWinningSegmentIndex
} from "../domain/giveaway/wheel";
import type { GiveawaySession, GiveawaySessionStatus } from "../types/entities";

type Tab = "quick" | "scenario" | "archive";

const statusLabel: Record<GiveawaySessionStatus, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed"
};

function spinSeconds(value: string | number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(2, Math.min(180, Math.round(parsed))) : 6;
}

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function sortSessions(sessions: GiveawaySession[]) {
  return [...sessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function buildSessionLabel(session: GiveawaySession) {
  return `${session.title} · ${statusLabel[session.status]}`;
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
    saveSpecialGiveawayItem,
    removeGiveawayItem,
    saveGiveawayParticipant,
    removeGiveawayParticipant,
    runGiveawaySpin
  } = useAppContext();

  const [tab, setTab] = useState<Tab>("quick");
  const [quickId, setQuickId] = useState("");
  const [scenarioId, setScenarioId] = useState("");
  const [archiveId, setArchiveId] = useState("");
  const [notice, setNotice] = useState("");
  const [spinInput, setSpinInput] = useState("6");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [lotProductId, setLotProductId] = useState("");
  const [specialTitle, setSpecialTitle] = useState("");
  const [specialDescription, setSpecialDescription] = useState("");
  const [specialEmoji, setSpecialEmoji] = useState("");
  const [specialImageUrl, setSpecialImageUrl] = useState("");
  const [participantNickname, setParticipantNickname] = useState("");
  const [participantComment, setParticipantComment] = useState("");
  const [scenarioForm, setScenarioForm] = useState({
    id: "",
    title: "",
    description: "",
    drawAt: "",
    spinDurationSec: "6"
  });
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const quickSessions = useMemo(
    () => sortSessions(state.giveawaySessions.filter((session) => session.mode === "quick")),
    [state.giveawaySessions]
  );
  const scenarioSessions = useMemo(
    () => sortSessions(state.giveawaySessions.filter((session) => session.mode === "scenario")),
    [state.giveawaySessions]
  );
  const archiveSessions = useMemo(
    () => sortSessions(state.giveawaySessions.filter((session) => session.status === "completed")),
    [state.giveawaySessions]
  );

  useEffect(() => {
    if (!quickSessions.length) {
      setQuickId("");
    } else if (!quickId || !quickSessions.some((session) => session.id === quickId)) {
      setQuickId(quickSessions[0].id);
    }
  }, [quickId, quickSessions]);

  useEffect(() => {
    if (!scenarioSessions.length) {
      setScenarioId("");
    } else if (!scenarioId || !scenarioSessions.some((session) => session.id === scenarioId)) {
      setScenarioId(scenarioSessions[0].id);
    }
  }, [scenarioId, scenarioSessions]);

  useEffect(() => {
    if (!archiveSessions.length) {
      setArchiveId("");
    } else if (!archiveId || !archiveSessions.some((session) => session.id === archiveId)) {
      setArchiveId(archiveSessions[0].id);
    }
  }, [archiveId, archiveSessions]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const activeSession =
    (tab === "quick"
      ? quickSessions.find((session) => session.id === quickId)
      : scenarioSessions.find((session) => session.id === scenarioId)) ?? null;
  const archiveSession = archiveSessions.find((session) => session.id === archiveId) ?? null;

  useEffect(() => {
    if (!activeSession) {
      return;
    }
    setSpinInput(String(spinSeconds(Math.round(activeSession.spinDurationMs / 1000))));
  }, [activeSession?.id, activeSession?.spinDurationMs]);

  useEffect(() => {
    if (!activeSession) {
      setSelectedParticipantId("");
      setLotProductId("");
      return;
    }
    const participants = state.giveawayParticipants.filter((item) => item.sessionId === activeSession.id);
    if (!selectedParticipantId || !participants.some((item) => item.id === selectedParticipantId)) {
      setSelectedParticipantId(participants[0]?.id ?? "");
    }
    const available = listProductsAvailableForGiveawaySession(
      state.products,
      state.giveawayItems.filter((item) => item.sessionId === activeSession.id)
    );
    if (!lotProductId || !available.some((product) => product.id === lotProductId)) {
      setLotProductId(available[0]?.id ?? "");
    }
  }, [activeSession, lotProductId, selectedParticipantId, state.giveawayItems, state.giveawayParticipants, state.products]);

  useEffect(() => {
    const session = scenarioSessions.find((item) => item.id === scenarioId) ?? scenarioSessions[0];
    if (!session) {
      return;
    }
    setScenarioForm({
      id: session.id,
      title: session.title,
      description: session.description,
      drawAt: toDatetimeLocal(session.drawAt),
      spinDurationSec: String(spinSeconds(Math.round(session.spinDurationMs / 1000)))
    });
  }, [scenarioId, scenarioSessions]);

  const sessionItems = useMemo(
    () => state.giveawayItems.filter((item) => item.sessionId === activeSession?.id),
    [activeSession?.id, state.giveawayItems]
  );
  const activeLots = useMemo(() => sessionItems.filter((item) => item.isActive), [sessionItems]);
  const participants = useMemo(
    () => state.giveawayParticipants.filter((item) => item.sessionId === activeSession?.id),
    [activeSession?.id, state.giveawayParticipants]
  );
  const results = useMemo(
    () =>
      state.giveawayResults
        .filter((item) => item.sessionId === activeSession?.id)
        .sort((a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime()),
    [activeSession?.id, state.giveawayResults]
  );
  const events = useMemo(
    () =>
      state.giveawayEvents
        .filter((item) => item.sessionId === activeSession?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [activeSession?.id, state.giveawayEvents]
  );
  const wheelSegments = useMemo(
    () => buildGiveawayWheelSegments(activeLots, state.products),
    [activeLots, state.products]
  );

  async function openSession(session: GiveawaySession) {
    if (activeLots.length === 0 || participants.length === 0) {
      setNotice("Add lots and participants before opening the session.");
      return;
    }
    const other = state.giveawaySessions.find((item) => item.status === "active" && item.id !== session.id);
    if (other) {
      const demoted = await updateGiveawaySessionStatus(other.id, "draft");
      if (!demoted) {
        return;
      }
    }
    if (await updateGiveawaySessionStatus(session.id, "active")) {
      setNotice("Session is active.");
    }
  }

  async function handleRemoveLot(itemId: string) {
    const removed = await removeGiveawayItem(itemId);
    if (removed) {
      setNotice("Lot removed.");
    }
  }

  async function runSpin() {
    const participant = participants.find((item) => item.id === selectedParticipantId);
    if (!activeSession || !participant || !wheelSegments.length || activeSession.status !== "active" || isSpinning) {
      return;
    }
    const segmentIndex = pickWinningSegmentIndex(wheelSegments.length);
    const segment = wheelSegments[segmentIndex];
    const item = sessionItems.find((entry) => entry.id === segment.giveawayItemId);
    if (!item) {
      return;
    }
    const durationMs = spinSeconds(spinInput) * 1000;
    const rotation = computeSpinTargetRotation(wheelRotation, segmentIndex, wheelSegments.length, durationMs);
    setIsSpinning(true);
    setWheelRotation(rotation);
    setNotice("");
    timeoutRef.current = window.setTimeout(() => {
      void (async () => {
        const ok = await runGiveawaySpin({
          sessionId: activeSession.id,
          giveawayItemId: item.id,
          participantId: participant.id,
          productId: item.productId,
          prizeTitle: item.title,
          itemType: item.itemType,
          winnerNickname: participant.nickname,
          spinDurationMs: durationMs,
          note: activeSession.mode === "quick" ? "Quick spin" : "Scenario spin"
        });
        setIsSpinning(false);
        if (ok) {
          setNotice("Spin saved.");
        }
      })();
    }, durationMs + 80);
  }

  async function saveScenario(event: FormEvent) {
    event.preventDefault();
    if (!scenarioForm.title.trim() || !scenarioForm.drawAt) {
      return;
    }
    const payload = {
      title: scenarioForm.title.trim(),
      description: scenarioForm.description.trim(),
      mode: "scenario" as const,
      drawAt: new Date(scenarioForm.drawAt).toISOString(),
      spinDurationMs: spinSeconds(scenarioForm.spinDurationSec) * 1000
    };
    const ok = scenarioForm.id
      ? await updateGiveawaySession(scenarioForm.id, payload)
      : await createGiveawaySession(payload);
    if (ok) {
      setNotice(scenarioForm.id ? "Scenario session updated." : "Scenario session created.");
    }
  }

  return (
    <div className="page stack-lg giveaway-module">
      <section className="card stack">
        <div className="row-between row-wrap">
          <div className="stack-sm">
            <h1>Giveaway Module</h1>
            <small>Quick mode, scenario sessions, archive, winner history and session log.</small>
          </div>
          <div className="toolbar">
            <button type="button" className={`btn btn_secondary${tab === "quick" ? " btn_active" : ""}`} onClick={() => setTab("quick")}>Quick</button>
            <button type="button" className={`btn btn_secondary${tab === "scenario" ? " btn_active" : ""}`} onClick={() => setTab("scenario")}>Scenario</button>
            <button type="button" className={`btn btn_secondary${tab === "archive" ? " btn_active" : ""}`} onClick={() => setTab("archive")}>Archive</button>
          </div>
        </div>
      </section>

      {tab === "quick" ? (
        <section className="card stack">
          <div className="row-between row-wrap">
            <div className="stack-sm"><h2 className="section-title">Quick giveaway</h2><small>Fast session for manual spins.</small></div>
            {isAdmin ? <button type="button" className="btn btn_primary" disabled={isSaving("giveaway")} onClick={() => { setQuickId(""); void createGiveawaySession({ title: `Quick giveaway ${new Date().toLocaleString("en-GB")}`, description: "Quick mode session for fast manual spins.", mode: "quick", drawAt: new Date().toISOString(), spinDurationMs: 4000 }).then((ok) => ok && setNotice("Quick giveaway session created.")); }}>New quick session</button> : null}
          </div>
          {quickSessions.length ? <select value={quickId} onChange={(event) => setQuickId(event.target.value)}>{quickSessions.map((session) => <option key={session.id} value={session.id}>{buildSessionLabel(session)}</option>)}</select> : <p>No quick sessions yet.</p>}
        </section>
      ) : null}

      {tab === "scenario" ? (
        <section className="card stack">
          <div className="row-between row-wrap">
            <div className="stack-sm"><h2 className="section-title">Scenario giveaway</h2><small>Persistent session with archive-ready history.</small></div>
            {scenarioSessions.length ? <select value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}>{scenarioSessions.map((session) => <option key={session.id} value={session.id}>{buildSessionLabel(session)}</option>)}</select> : null}
          </div>
          {isAdmin ? (
            <form className="stack" onSubmit={(event) => void saveScenario(event)}>
              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field"><span>Title</span><input value={scenarioForm.title} onChange={(event) => setScenarioForm((prev) => ({ ...prev, title: event.target.value }))} /></label>
                <label className="field"><span>Draw time</span><input type="datetime-local" value={scenarioForm.drawAt} onChange={(event) => setScenarioForm((prev) => ({ ...prev, drawAt: event.target.value }))} /></label>
                <label className="field"><span>Spin sec</span><input type="number" min={2} max={180} value={scenarioForm.spinDurationSec} onChange={(event) => setScenarioForm((prev) => ({ ...prev, spinDurationSec: event.target.value }))} /></label>
              </div>
              <label className="field"><span>Description</span><textarea rows={2} value={scenarioForm.description} onChange={(event) => setScenarioForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
              <div className="toolbar"><button type="submit" className="btn btn_primary">Save session</button><button type="button" className="btn btn_secondary" onClick={() => setScenarioForm({ id: "", title: "", description: "", drawAt: "", spinDurationSec: "6" })}>New form</button></div>
            </form>
          ) : null}
        </section>
      ) : null}

      {tab !== "archive" && activeSession ? (
        <>
          <section className="card stack">
            <div className="row-between row-wrap">
              <div className="stack-sm"><h2 className="section-title">{activeSession.title}</h2><small>{statusLabel[activeSession.status]} · {activeSession.mode} · {new Date(activeSession.drawAt).toLocaleString("en-GB")}</small></div>
              {isAdmin ? <div className="toolbar">{activeSession.status === "active" ? <button type="button" className="btn btn_secondary" onClick={() => void updateGiveawaySessionStatus(activeSession.id, "draft")}>Stop to draft</button> : <button type="button" className="btn btn_primary" onClick={() => void openSession(activeSession)} disabled={activeLots.length === 0 || participants.length === 0}>Open session</button>}<button type="button" className="btn btn_secondary" onClick={() => void updateGiveawaySessionStatus(activeSession.id, "completed")}>Complete</button></div> : null}
            </div>
            <div className="giveaway-stat-grid">
              <div className="card giveaway-mini-card"><strong>{activeLots.length}</strong><small>Active lots</small></div>
              <div className="card giveaway-mini-card"><strong>{participants.length}</strong><small>Participants</small></div>
              <div className="card giveaway-mini-card"><strong>{results.length}</strong><small>Saved results</small></div>
              <div className="card giveaway-mini-card"><strong>{events.length}</strong><small>Log entries</small></div>
            </div>
          </section>

          <section className="card giveaway-board">
            <GiveawayWheel segments={wheelSegments} rotationDeg={wheelRotation} spinDurationMs={spinSeconds(spinInput) * 1000} isSpinning={isSpinning} />
            <div className="giveaway-side stack">
              <label className="field"><span>Spin sec</span><input type="number" min={2} max={180} value={spinInput} onChange={(event) => setSpinInput(event.target.value)} /></label>
              <label className="field"><span>Participant</span><select value={selectedParticipantId} onChange={(event) => setSelectedParticipantId(event.target.value)}>{participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.nickname}</option>)}</select></label>
              <button type="button" className="btn btn_primary" onClick={() => void runSpin()} disabled={!participants.length || !activeLots.length || activeSession.status !== "active" || isSpinning}>{isSpinning ? "Spinning..." : "Run spin"}</button>
              {results[0] ? <div className="card giveaway-win"><h3>Latest winner</h3><p>{results[0].prizeTitle}</p><small>{results[0].winnerNickname}</small></div> : null}
            </div>
          </section>

          {isAdmin ? (
            <section className="giveaway-grid">
              <article className="card stack giveaway-panel">
                <h3>Lots</h3>
                <label className="field"><span>Add catalog product</span><select value={lotProductId} onChange={(event) => setLotProductId(event.target.value)}>{listProductsAvailableForGiveawaySession(state.products, sessionItems).map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}</select></label>
                <button type="button" className="btn btn_secondary" onClick={() => void attachProductToGiveaway(activeSession.id, lotProductId).then((ok) => ok && setNotice("Catalog lot added."))} disabled={!lotProductId}>Add catalog lot</button>
                <div className="admin-panel__divider" />
                <label className="field"><span>Special prize</span><input value={specialTitle} onChange={(event) => setSpecialTitle(event.target.value)} /></label>
                <label className="field"><span>Description</span><textarea rows={2} value={specialDescription} onChange={(event) => setSpecialDescription(event.target.value)} /></label>
                <div className="admin-panel__grid admin-panel__grid_compact">
                  <label className="field"><span>Emoji</span><input value={specialEmoji} onChange={(event) => setSpecialEmoji(event.target.value)} /></label>
                  <label className="field"><span>Image URL</span><input value={specialImageUrl} onChange={(event) => setSpecialImageUrl(event.target.value)} /></label>
                </div>
                <button type="button" className="btn btn_secondary" onClick={() => void saveSpecialGiveawayItem({ sessionId: activeSession.id, itemType: "special_prize", title: specialTitle, description: specialDescription, emoji: specialEmoji, imageUrl: specialImageUrl, productId: null, slots: 1, isActive: true }).then((ok) => ok && setNotice("Special prize added."))} disabled={!specialTitle.trim()}>Add special prize</button>
                <div className="giveaway-list">{sessionItems.map((item) => <div key={item.id} className="giveaway-list__row"><div className="stack-sm"><strong>{item.title}</strong><small>{item.itemType === "catalog_product" ? "Catalog product" : "Special prize"} · {item.isActive ? "active" : "completed"}</small></div><button type="button" className="btn btn_ghost btn_compact" disabled={!item.isActive} onClick={() => void handleRemoveLot(item.id)}>Remove</button></div>)}</div>
              </article>
              <article className="card stack giveaway-panel">
                <h3>Participants</h3>
                <label className="field"><span>Nickname</span><input value={participantNickname} onChange={(event) => setParticipantNickname(event.target.value)} placeholder="@nickname" /></label>
                <label className="field"><span>Comment</span><textarea rows={2} value={participantComment} onChange={(event) => setParticipantComment(event.target.value)} /></label>
                <button type="button" className="btn btn_secondary" onClick={() => void saveGiveawayParticipant({ sessionId: activeSession.id, nickname: participantNickname, comment: participantComment }).then((ok) => ok && setNotice("Participant added."))} disabled={!participantNickname.trim()}>Add participant</button>
                <div className="giveaway-list">{participants.map((participant) => <div key={participant.id} className="giveaway-list__row"><div className="stack-sm"><strong>{participant.nickname}</strong><small>{participant.comment || "No comment"}</small></div><button type="button" className="btn btn_ghost btn_compact" onClick={() => void removeGiveawayParticipant(participant.id).then((ok) => ok && setNotice("Participant removed."))}>Remove</button></div>)}</div>
              </article>
            </section>
          ) : null}

          <section className="giveaway-grid">
            <article className="card stack giveaway-panel"><h3>Results</h3><div className="giveaway-list">{results.length === 0 ? <p>No results yet.</p> : results.map((result) => <div key={result.id} className="giveaway-list__row"><div className="stack-sm"><strong>{result.prizeTitle}</strong><small>{new Date(result.wonAt).toLocaleString("en-GB")}</small></div><small>{result.winnerNickname}</small></div>)}</div></article>
            <article className="card stack giveaway-panel"><h3>Session log</h3><div className="giveaway-log">{events.length === 0 ? <p>No events yet.</p> : events.map((event) => <div key={event.id} className="giveaway-log__item"><strong>{event.message}</strong><small>{new Date(event.createdAt).toLocaleString("en-GB")}</small></div>)}</div></article>
          </section>
        </>
      ) : null}

      {tab === "archive" ? (
        <section className="giveaway-grid giveaway-grid_archive">
          <article className="card stack giveaway-panel">
            <h2 className="section-title">Archive</h2>
            <div className="giveaway-list">{archiveSessions.length === 0 ? <p>No archive yet.</p> : archiveSessions.map((session) => <button key={session.id} type="button" className={`giveaway-list__row giveaway-list__row_button${archiveId === session.id ? " giveaway-list__row_active" : ""}`} onClick={() => setArchiveId(session.id)}><span><strong>{session.title}</strong><small>{session.mode} · {new Date(session.drawAt).toLocaleString("en-GB")}</small></span></button>)}</div>
            <div className="admin-panel__divider" />
            <h3>Winner history</h3>
            <div className="giveaway-log">{state.giveawayResults.slice().sort((a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime()).map((result) => <div key={result.id} className="giveaway-log__item"><strong>{result.winnerNickname} · {result.prizeTitle}</strong><small>{new Date(result.wonAt).toLocaleString("en-GB")}</small></div>)}</div>
          </article>
          <article className="card stack giveaway-panel">
            {!archiveSession ? <p>Select a completed session.</p> : <><h2 className="section-title">{archiveSession.title}</h2><small>{archiveSession.mode} · {new Date(archiveSession.drawAt).toLocaleString("en-GB")}</small><p>{archiveSession.description || "No description."}</p><h3>Results</h3><div className="giveaway-list">{state.giveawayResults.filter((item) => item.sessionId === archiveSession.id).map((result) => <div key={result.id} className="giveaway-list__row"><div className="stack-sm"><strong>{result.prizeTitle}</strong><small>{result.winnerNickname}</small></div><small>{new Date(result.wonAt).toLocaleString("en-GB")}</small></div>)}</div><h3>Lots</h3><div className="giveaway-list">{state.giveawayItems.filter((item) => item.sessionId === archiveSession.id).map((item) => <div key={item.id} className="giveaway-list__row"><div className="stack-sm"><strong>{item.title}</strong><small>{item.itemType === "catalog_product" ? "Catalog product" : "Special prize"}</small></div></div>)}</div><h3>Session log</h3><div className="giveaway-log">{state.giveawayEvents.filter((item) => item.sessionId === archiveSession.id).map((event) => <div key={event.id} className="giveaway-log__item"><strong>{event.message}</strong><small>{new Date(event.createdAt).toLocaleString("en-GB")}</small></div>)}</div></>}
          </article>
        </section>
      ) : null}

      {!state.giveawaySessions.length && isAdmin ? <section className="card empty-state"><p>No sessions yet.</p><Link className="btn btn_secondary" to="/profile">Back to admin profile</Link></section> : null}
      {!isAdmin ? <section className="card"><small>Admin actions are available only for administrators.</small></section> : null}
      {notice ? <section className="mode-banner mode-banner_compact"><span>{notice}</span></section> : null}
    </div>
  );
}
