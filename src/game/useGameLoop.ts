import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { clamp, intersects } from './collision';
import { GROUND_Y, MAX_HEALTH, PHYSICS, STAGE_WIDTH, VIEW_WIDTH, soundEvent } from './constants';
import type { Collectible, ControlsState, GameSnapshot, Obstacle, Particle, PuppyState, StageData } from './types';

const initialPuppy = (): PuppyState => ({
  x: 48,
  y: GROUND_Y - PHYSICS.puppyHeight,
  width: PHYSICS.puppyWidth,
  height: PHYSICS.puppyHeight,
  vx: 0,
  vy: 0,
  facing: 1,
  grounded: true,
  dashing: false,
  invincibleUntil: 0,
});

const makePaw = (id: number, puppy: PuppyState): Particle => ({
  id,
  x: puppy.x + puppy.width / 2,
  y: puppy.y + puppy.height - 4,
  kind: puppy.dashing ? 'heart' : 'paw',
  ttl: 34,
});

export const useGameLoop = ({
  controlsRef,
  stage,
  bestSnacks,
  onClear,
  onFail,
}: {
  controlsRef: RefObject<ControlsState>;
  stage: StageData;
  bestSnacks: number;
  onClear: (snapshot: GameSnapshot) => void;
  onFail: (snapshot: GameSnapshot) => void;
}) => {
  const [puppy, setPuppy] = useState(initialPuppy);
  const [collectibles, setCollectibles] = useState<Collectible[]>(() => stage.collectibles.map((item) => ({ ...item })));
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => stage.obstacles.map((item) => ({ ...item })));
  const [health, setHealth] = useState(MAX_HEALTH);
  const [snacks, setSnacks] = useState(0);
  const [ribbonFound, setRibbonFound] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [tipIndex, setTipIndex] = useState(0);
  const snacksRef = useRef(0);
  const ribbonFoundRef = useRef(false);
  const bestSnacksRef = useRef(bestSnacks);
  const frameRef = useRef<number | null>(null);
  const particleId = useRef(1);
  const lastPawAt = useRef(0);
  const lastGroundedAt = useRef(0);
  const lastSafeX = useRef(48);
  const lastJumpAt = useRef(0);
  const lastDashAt = useRef(0);
  const lastFallDamageAt = useRef(0);
  const dashUntil = useRef(0);
  const finishedRef = useRef(false);

  const reset = useCallback(() => {
    finishedRef.current = false;
    setPuppy(initialPuppy());
    setCollectibles(stage.collectibles.map((item) => ({ ...item })));
    setObstacles(stage.obstacles.map((item) => ({ ...item })));
    setHealth(MAX_HEALTH);
    setSnacks(0);
    setRibbonFound(false);
    setParticles([]);
    setTipIndex(0);
  }, [stage]);

  useEffect(() => {
    snacksRef.current = snacks;
  }, [snacks]);

  useEffect(() => {
    ribbonFoundRef.current = ribbonFound;
  }, [ribbonFound]);

  useEffect(() => {
    bestSnacksRef.current = bestSnacks;
  }, [bestSnacks]);

  const requestJump = useCallback(() => {
    const now = performance.now();
    if (now - lastJumpAt.current < 260) return;
    setPuppy((current) => {
      if (!current.grounded && now - lastGroundedAt.current > 160) return current;
      lastJumpAt.current = now;
      soundEvent('jump');
      return {
        ...current,
        y: Math.min(current.y, GROUND_Y - current.height) - 22,
        vy: PHYSICS.jumpVelocity,
        grounded: false,
      };
    });
  }, []);

  const requestDash = useCallback(() => {
    const now = performance.now();
    if (now - lastDashAt.current < 360) return;
    lastDashAt.current = now;
    dashUntil.current = now + 360;
    setPuppy((current) => {
      const x = clamp(current.x + current.facing * 112, 0, STAGE_WIDTH - current.width);
      setParticles((items) => [
        ...items,
        { id: particleId.current++, x: x + current.width / 2 - current.facing * 24, y: current.y + current.height - 4, kind: 'heart' as const, ttl: 42 },
        { id: particleId.current++, x: x + current.width / 2 - current.facing * 58, y: current.y + current.height + 2, kind: 'heart' as const, ttl: 36 },
      ].slice(-22));
      soundEvent('dash');
      return {
        ...current,
        x,
        vx: current.facing * PHYSICS.dashSpeed,
        dashing: true,
      };
    });
  }, []);

  useEffect(() => {
    const tick = () => {
      setPuppy((current) => {
        const now = performance.now();
        const controlsNow = controlsRef.current;
        const next = { ...current, dashing: now < dashUntil.current };

        if (controlsNow.left) {
          next.vx = -PHYSICS.moveSpeed;
          next.facing = -1;
        } else if (controlsNow.right) {
          next.vx = PHYSICS.moveSpeed;
          next.facing = 1;
        } else {
          next.vx *= PHYSICS.friction;
        }

        if (next.grounded) lastGroundedAt.current = now;

        next.vy += PHYSICS.gravity;
        next.x = clamp(next.x + next.vx, 0, STAGE_WIDTH - next.width);
        next.y += next.vy;
        next.grounded = false;

        for (const platform of stage.platforms) {
          const previousBottom = current.y + current.height;
          const nextBottom = next.y + next.height;
          const crossedPlatformTop = previousBottom <= platform.y + 24 && nextBottom >= platform.y;
          const footX = next.x + next.width / 2;
          const footOverPlatform = footX >= platform.x && footX <= platform.x + platform.width;
          if (next.vy >= 0 && crossedPlatformTop && footOverPlatform) {
            next.y = platform.y - next.height;
            next.vy = 0;
            next.grounded = true;
            lastSafeX.current = next.x;
            lastGroundedAt.current = now;
          }
        }

        if (next.y > GROUND_Y + 130) {
          const shouldDamageFall = now - lastFallDamageAt.current > 700;
          if (shouldDamageFall) lastFallDamageAt.current = now;
          const respawnX = Math.max(24, lastSafeX.current - 30);
          const respawnPlatform =
            stage.platforms.find((platform) => {
              const respawnFootX = respawnX + next.width / 2;
              return respawnFootX >= platform.x && respawnFootX <= platform.x + platform.width;
            }) ??
            stage.platforms[0];
          next.x = respawnX;
          next.y = respawnPlatform.y - next.height;
          next.vx = 0;
          next.vy = 0;
          next.grounded = true;
          lastSafeX.current = next.x;
          lastGroundedAt.current = now;
          next.invincibleUntil = now + 900;
          if (shouldDamageFall) {
            setHealth((value) => {
              const nextHealth = Math.max(0, value - 1);
              if (nextHealth === 0 && !finishedRef.current) {
                finishedRef.current = true;
                onFail({
                  snacks: snacksRef.current,
                  health: nextHealth,
                  ribbonFound: ribbonFoundRef.current,
                  bestSnacks: bestSnacksRef.current,
                });
              }
              return nextHealth;
            });
          }
        }

        if ((Math.abs(next.vx) > 2 || next.dashing) && next.grounded && now - lastPawAt.current > (next.dashing ? 70 : 140)) {
          lastPawAt.current = now;
          setParticles((items) => [...items, makePaw(particleId.current++, next)].slice(-18));
        }

        return next;
      });

      setObstacles((items) =>
        items.map((item) => {
          if (item.type !== 'ball') return item;
          const min = item.minX ?? item.x - 90;
          const max = item.maxX ?? item.x + 130;
          let x = item.x + (item.vx ?? 1);
          let vx = item.vx ?? 1;
          if (x < min || x > max) {
            vx *= -1;
            x = clamp(x, min, max);
          }
          return { ...item, x, vx };
        }),
      );

      setParticles((items) => items.map((item) => ({ ...item, ttl: item.ttl - 1, y: item.y - 0.35 })).filter((item) => item.ttl > 0));
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [stage.platforms]);

  useEffect(() => {
    const now = performance.now();

    setCollectibles((items) =>
      items.map((item) => {
        if (item.collected || !intersects(puppy, item, -10)) return item;
        if (item.type === 'bone') {
          setSnacks((count) => count + 1);
          setTipIndex((index) => Math.max(index, 1));
        }
        if (item.type === 'heart') setHealth((value) => Math.min(MAX_HEALTH, value + 1));
        if (item.type === 'ribbon-box') {
          setRibbonFound(true);
          setTipIndex(2);
          soundEvent('unlock');
        } else {
          soundEvent('collect');
        }
        setParticles((current) => [
          ...current,
          { id: particleId.current++, x: item.x + item.width / 2, y: item.y, kind: item.type === 'ribbon-box' ? 'heart' : 'sparkle', ttl: 42 },
        ]);
        return { ...item, collected: true };
      }),
    );

    for (const obstacle of obstacles) {
      if (!intersects(puppy, obstacle, obstacle.type === 'puddle' ? 8 : 14)) continue;
      if (obstacle.type === 'puddle') {
        setPuppy((current) => ({ ...current, vx: current.facing * 5.5 }));
        continue;
      }
      if (puppy.invincibleUntil > now) continue;
      soundEvent('hit');
      setHealth((value) => {
        const nextHealth = Math.max(0, value - 1);
        if (nextHealth === 0 && !finishedRef.current) {
          finishedRef.current = true;
          onFail({ snacks, health: nextHealth, ribbonFound, bestSnacks });
        }
        return nextHealth;
      });
      setPuppy((current) => ({
        ...current,
        x: Math.max(24, current.x - 56 * current.facing),
        vx: -current.facing * 3,
        invincibleUntil: now + 1200,
      }));
    }

    if (intersects(puppy, stage.goal, -8) && !finishedRef.current) {
      finishedRef.current = true;
      soundEvent('clear');
      onClear({ snacks, health, ribbonFound, bestSnacks: Math.max(bestSnacks, snacks) });
    }
  }, [bestSnacks, health, obstacles, onClear, onFail, puppy, ribbonFound, snacks, stage.goal]);

  const cameraX = clamp(puppy.x - VIEW_WIDTH * 0.42, 0, STAGE_WIDTH - VIEW_WIDTH);

  return {
    puppy,
    collectibles,
    obstacles,
    particles,
    health,
    snacks,
    ribbonFound,
    cameraX,
    tipIndex,
    reset,
    requestJump,
    requestDash,
  };
};
