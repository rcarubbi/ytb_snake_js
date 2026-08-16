"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Game from "@/lib/game/Game";
import KeyboardListener from "@/lib/listeners/KeyboardListener";
import SwipeGestureListener from "@/lib/listeners/SwipeGestureListener";
import SnakeRenderer from "@/lib/renderers/SnakeRenderer";
import ScoreRenderer from "@/lib/renderers/ScoreRenderer";
import AppleRenderer from "@/lib/renderers/AppleRenderer";
import BombRenderer from "@/lib/renderers/BombRenderer";
import gameClient from "@/lib/gameClient";
import controls from "@/lib/game/controls";
import type { GameState } from "@/lib/game/types";
import HUD from "./HUD";
import GameScreen from "./GameScreen";
import SettingsDrawer from "./SettingsDrawer";
import Toast, { type ToastData } from "./Toast";

const PLAYER_NAME_KEY = "snake.playerName";
const PENDING_JOIN_KEY = "snake.pendingJoin";

interface Renderers {
  snake: SnakeRenderer;
  score: ScoreRenderer;
  apple: AppleRenderer;
  bomb: BombRenderer;
}

export default function GameApp() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [speed, setSpeed] = useState(15);
  const [players, setPlayers] = useState(2);
  const [apples, setApples] = useState(1);
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem(PLAYER_NAME_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [roomToJoin, setRoomToJoin] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [crtOn, setCrtOn] = useState(false);
  const [turningOff, setTurningOff] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const tvRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gameRef = useRef<Game | null>(null);
  const latestStateRef = useRef<GameState | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const renderersRef = useRef<Renderers | null>(null);

  const onlineRef = useRef(online);
  const speedRef = useRef(speed);
  const playersRef = useRef(players);
  const applesRef = useRef(apples);
  const playerNameRef = useRef(playerName);
  const roomIdRef = useRef<string | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const connectPromiseRef = useRef<Promise<void> | null>(null);
  const keyboardListenerRef = useRef(new KeyboardListener());
  const swipeListenerRef = useRef(new SwipeGestureListener());

  useEffect(() => {
    onlineRef.current = online;
  }, [online]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  useEffect(() => {
    applesRef.current = apples;
  }, [apples]);
  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);
  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  useEffect(() => {
    try {
      localStorage.setItem(PLAYER_NAME_KEY, playerName);
    } catch {
      // ignore
    }
  }, [playerName]);

  const showToast = useCallback((message: string, type: "error" | "info" = "error") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const getGameSettings = useCallback(() => ({
    numberOfPlayers: playersRef.current,
    numberOfApples: applesRef.current,
    speed: speedRef.current,
    canvasWidth: canvasRef.current?.width ?? 1120,
    canvasHeight: canvasRef.current?.height ?? 1040,
    playerId: playerNameRef.current,
  }), []);

  const ensureOnlineConnection = useCallback(async () => {
    if (!connectPromiseRef.current) {
      connectPromiseRef.current = gameClient.connectAsync().then(() => {
        gameClient.onStateChange((state) => {
          latestStateRef.current = state;
        });
      });
    }
    return connectPromiseRef.current;
  }, []);

  const resizeGameArea = useCallback(() => {
    const tv = tvRef.current;
    const screen = screenRef.current;
    const canvas = canvasRef.current;
    if (!tv || !screen || !canvas) return;
    const scale = Math.min(tv.clientWidth / canvas.width, tv.clientHeight / canvas.height);
    screen.style.width = `${Math.floor(canvas.width * scale)}px`;
    screen.style.height = `${Math.floor(canvas.height * scale)}px`;
  }, []);

  const draw = useCallback((state: GameState) => {
    const renderers = renderersRef.current;
    if (!renderers) return;
    renderers.snake.draw(state);
    renderers.score.draw(state);
    renderers.apple.draw(state);
    renderers.bomb.draw(state);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderersRef.current = {
      snake: new SnakeRenderer(canvasRef.current),
      score: new ScoreRenderer(canvasRef.current),
      apple: new AppleRenderer(canvasRef.current),
      bomb: new BombRenderer(canvasRef.current),
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = (timestamp: number) => {
      const game = gameRef.current;
      if (game) {
        if (
          lastFrameRef.current === null ||
          timestamp - lastFrameRef.current >= 1000 / speedRef.current
        ) {
          lastFrameRef.current = timestamp;
          const state = game.updateState();
          if (state) draw(state);
        }
      } else if (latestStateRef.current) {
        draw(latestStateRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  useEffect(() => {
    const tv = tvRef.current;
    if (!tv) return;
    resizeGameArea();
    const observer = new ResizeObserver(resizeGameArea);
    observer.observe(tv);
    window.addEventListener("resize", resizeGameArea);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeGameArea);
    };
  }, [resizeGameArea]);

  const stopGameEnd = useCallback(() => {
    gameRef.current = null;
    latestStateRef.current = null;
    lastFrameRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setCrtOn(false);
    setTurningOff(false);
  }, []);

  useEffect(() => {
    const screen = screenRef.current;
    screen?.addEventListener("animationend", stopGameEnd);
    return () => screen?.removeEventListener("animationend", stopGameEnd);
  }, [stopGameEnd]);

  const startGame = useCallback(() => {
    try {
      if (!onlineRef.current) {
        gameRef.current = new Game(getGameSettings());
        gameRef.current.start();
      }
      lastFrameRef.current = null;
      setTurningOff(false);
      setCrtOn(true);
      setRunning(true);
    } catch (err) {
      alert(err);
    }
  }, [getGameSettings]);

  const stopGameStart = useCallback(async () => {
    setRunning(false);
    setTurningOff(true);
    if (onlineRef.current && roomIdRef.current) {
      await gameClient.leaveRoom(roomIdRef.current, playerIdRef.current);
      roomIdRef.current = null;
      playerIdRef.current = null;
      setRoomId(null);
      setPlayerId(null);
    }
  }, []);

  const createRoom = useCallback(async () => {
    if (!playerNameRef.current.trim()) {
      showToast("Enter a player name first");
      return;
    }
    setBusy(true);
    await ensureOnlineConnection();
    const response = await gameClient.createRoom(getGameSettings());
    if (!response || response.error) {
      showToast(response?.error || "Failed to create room");
      setBusy(false);
      return;
    }
    playerIdRef.current = response.playerId ?? null;
    roomIdRef.current = response.roomId ?? null;
    speedRef.current = response.speed ?? speedRef.current;
    if (canvasRef.current && response.canvasWidth && response.canvasHeight) {
      canvasRef.current.width = response.canvasWidth;
      canvasRef.current.height = response.canvasHeight;
    }
    setPlayerId(playerIdRef.current);
    setRoomId(roomIdRef.current);
    setBusy(false);
    resizeGameArea();
    startGame();
  }, [ensureOnlineConnection, getGameSettings, resizeGameArea, startGame, showToast]);

  const joinRoom = useCallback(async () => {
    if (!playerNameRef.current.trim()) {
      showToast("Enter a player name first");
      return;
    }
    if (!roomToJoin.trim()) {
      showToast("Enter a room ID");
      return;
    }
    setBusy(true);
    await ensureOnlineConnection();
    const response = await gameClient.joinRoom(roomToJoin.trim(), playerNameRef.current);
    if (!response || response.error) {
      showToast(response?.error || "Room not found");
      setBusy(false);
      return;
    }
    playerIdRef.current = response.playerId ?? null;
    roomIdRef.current = response.roomId ?? null;
    speedRef.current = response.speed ?? speedRef.current;
    if (canvasRef.current && response.canvasWidth && response.canvasHeight) {
      canvasRef.current.width = response.canvasWidth;
      canvasRef.current.height = response.canvasHeight;
    }
    setPlayerId(playerIdRef.current);
    setRoomId(roomIdRef.current);
    setBusy(false);
    resizeGameArea();
    startGame();
  }, [ensureOnlineConnection, resizeGameArea, roomToJoin, showToast, startGame]);

  const leaveRoom = useCallback(async () => {
    setBusy(true);
    await stopGameStart();
    if (roomIdRef.current) {
      await gameClient.leaveRoom(roomIdRef.current, playerIdRef.current);
    }
    roomIdRef.current = null;
    playerIdRef.current = null;
    setRoomId(null);
    setPlayerId(null);
    setBusy(false);
  }, [stopGameStart]);

  const toggleOnline = useCallback(async (checked: boolean) => {
    setOnline(checked);
    if (checked) {
      await ensureOnlineConnection();
    } else {
      if (roomIdRef.current) {
        await gameClient.leaveRoom(roomIdRef.current, playerIdRef.current);
        roomIdRef.current = null;
        playerIdRef.current = null;
        setRoomId(null);
        setPlayerId(null);
      }
      await gameClient.disconnectAsync();
      connectPromiseRef.current = null;
    }
  }, [ensureOnlineConnection]);

  useEffect(() => {
    if (!online) return;
    ensureOnlineConnection().catch(() => showToast("Connection failed"));
  }, [online, ensureOnlineConnection, showToast]);

  useEffect(() => {
    let cancelled = false;
    try {
      const pending = sessionStorage.getItem(PENDING_JOIN_KEY);
      if (!pending) return;
      const data = JSON.parse(pending);
      if (data?.roomId && data?.playerId) {
        void (async () => {
          await ensureOnlineConnection();
          if (cancelled) return;
          playerIdRef.current = data.playerId;
          roomIdRef.current = data.roomId;
          speedRef.current = data.speed ?? speedRef.current;
          if (canvasRef.current && data.canvasWidth && data.canvasHeight) {
            canvasRef.current.width = data.canvasWidth;
            canvasRef.current.height = data.canvasHeight;
          }
          setPlayerId(data.playerId);
          setRoomId(data.roomId);
          sessionStorage.removeItem(PENDING_JOIN_KEY);
          resizeGameArea();
          startGame();
        })();
      } else {
        sessionStorage.removeItem(PENDING_JOIN_KEY);
      }
    } catch {
      sessionStorage.removeItem(PENDING_JOIN_KEY);
    }
    return () => {
      cancelled = true;
    };
  }, [ensureOnlineConnection, resizeGameArea, startGame]);

  const keyboardHandler = useCallback((key: string) => {
    if (gameRef.current) {
      gameRef.current.keyPressed(key);
    } else if (roomIdRef.current) {
      gameClient.keyPressed(roomIdRef.current, key, playerIdRef.current);
    }
  }, []);

  const swipeGestureHandler = useCallback(
    (direction: string) => {
      const key = {
        left: "ArrowLeft",
        right: "ArrowRight",
        up: "ArrowUp",
        down: "ArrowDown",
      }[direction];
      if (key) {
        keyboardHandler(key);
      }
    },
    [keyboardHandler]
  );

  const tapGestureHandler = useCallback(() => {
    const bombKey = controls[0].bomb;
    if (roomIdRef.current) {
      gameClient.keyPressed(roomIdRef.current, bombKey, playerIdRef.current);
    } else if (gameRef.current) {
      gameRef.current.keyPressed(bombKey);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      keyboardListenerRef.current.listen(event, keyboardHandler);
    };
    const onTouchStart = (event: TouchEvent) => {
      swipeListenerRef.current.listen(event);
    };
    const onTouchEnd = (event: TouchEvent) => {
      swipeListenerRef.current.listen(event, swipeGestureHandler, tapGestureHandler);
    };
    const onCanvasTouchMove = (event: TouchEvent) => {
      if (event.target === canvasRef.current) {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onTouchEnd);
    const canvas = canvasRef.current;
    canvas?.addEventListener("touchmove", onCanvasTouchMove, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      canvas?.removeEventListener("touchmove", onCanvasTouchMove);
    };
  }, [keyboardHandler, swipeGestureHandler, tapGestureHandler]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#060a08] text-zinc-200">
      <HUD
        online={online}
        roomId={roomId}
        running={running}
        drawerOpen={drawerOpen}
        onStart={startGame}
        onStop={stopGameStart}
        onToggleSettings={() => setDrawerOpen((open) => !open)}
        onBrowseRooms={() => router.push("/rooms")}
      />

      <main className="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4">
        <GameScreen
          tvRef={tvRef}
          screenRef={screenRef}
          scanlineRef={scanlineRef}
          canvasRef={canvasRef}
          crtOn={crtOn}
          turningOff={turningOff}
        />
      </main>

      <SettingsDrawer
        open={drawerOpen}
        online={online}
        running={running}
        busy={busy}
        speed={speed}
        players={players}
        apples={apples}
        playerName={playerName}
        roomId={roomId}
        roomToJoin={roomToJoin}
        onToggleOnline={toggleOnline}
        onSpeedChange={setSpeed}
        onPlayersChange={setPlayers}
        onApplesChange={setApples}
        onPlayerNameChange={setPlayerName}
        onRoomToJoinChange={setRoomToJoin}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onLeaveRoom={leaveRoom}
        onClose={() => setDrawerOpen(false)}
      />

      <Toast toast={toast} />
    </div>
  );
}
