"use client";

import React, { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";

/* ───────── seeded PRNG ───────── */
function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

/* ───────── types ───────── */
interface Startup {
    id: number;
    name: string;
    description: string;
    sector: string;
    country: string;
    founders: string[];
    investors: string[];
    start_year: number;
    end_year: number;
    total_funding: number;
    cause_of_death: string;
    the_loot: string[];
}

interface GraveProps {
    startup: Startup;
    position: [number, number, number];
    index: number;
    onHover: (startup: Startup | null, screenPos: { x: number; y: number } | null) => void;
    onClick: (startup: Startup) => void;
}

/* ───────── helpers ───────── */
function formatFunding(n: number): string {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n}`;
}

const SHAPE_CLASSES = ["shape-arch", "shape-cross", "shape-obelisk", "shape-broken", "shape-winged"];

const SECTOR_GRADIENTS: Record<string, string> = {
    ecommerce: "linear-gradient(135deg, #4a4a5e 0%, #2e2e3e 40%, #252535 100%)",
    ondemand: "linear-gradient(135deg, #3e3e55 0%, #282840 40%, #1e1e30 100%)",
    health: "linear-gradient(135deg, #2e3e2e 0%, #1a2a1a 60%, #142014 100%)",
    social: "linear-gradient(135deg, #5a3a3a 0%, #3e2020 40%, #2e1515 100%)",
    hardware: "linear-gradient(135deg, #4a4a5e 0%, #2e2e3e 40%, #252535 100%)",
    fintech: "linear-gradient(135deg, #3a3a5e 0%, #22223e 60%, #181830 100%)",
    edtech: "linear-gradient(135deg, #3a4a3a 0%, #222e22 60%, #181e18 100%)",
    travel: "linear-gradient(135deg, #3a4a5a 0%, #222e3e 60%, #181e28 100%)",
    food: "linear-gradient(135deg, #4a4a3a 0%, #2e2e22 60%, #252518 100%)",
    default: "linear-gradient(135deg, #4a4a5e 0%, #2e2e3e 40%, #252535 100%)",
};

function getSectorGradient(sector: string): string {
    return SECTOR_GRADIENTS[sector?.toLowerCase()] || SECTOR_GRADIENTS.default;
}

const FLOWERS = ["🥀🌹🥀", "💐", "🌸🌸", "🌺", "🪻🌷", "🌼", "💮", "🥀", "🪴", "🌻", "🎋", "🍂🍁"];

/* ───────── GROUND ───────── */
function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <planeGeometry args={[300, 300]} />
            <meshBasicMaterial color="#0d0d1a" />
        </mesh>
    );
}

/* ───────── DEAD TREE ───────── */
function DeadTree({ position, seed }: { position: [number, number, number]; seed: number }) {
    const data = useMemo(() => {
        const rng = seededRandom(seed);
        const th = 2.5 + rng() * 3;
        return {
            th,
            lean: (rng() - 0.5) * 0.25,
            rotY: rng() * Math.PI * 2,
            branches: Array.from({ length: 4 }, () => ({
                a: (rng() - 0.5) * 1.2,
                y: th * (0.45 + rng() * 0.5),
                l: 0.5 + rng() * 1.2,
                r: rng() * Math.PI * 2,
            })),
        };
    }, [seed]);

    return (
        <group position={position} rotation={[0, data.rotY, data.lean]}>
            <mesh position={[0, data.th / 2, 0]}>
                <cylinderGeometry args={[0.04, 0.14, data.th, 5]} />
                <meshBasicMaterial color="#1a1410" />
            </mesh>
            {data.branches.map((b, i) => (
                <group key={i} position={[0, b.y, 0]} rotation={[0, b.r, b.a]}>
                    <mesh position={[b.l / 2, 0, 0]}>
                        <cylinderGeometry args={[0.01, 0.04, b.l, 3]} />
                        <meshBasicMaterial color="#1a1410" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/* ───────── CSS TOMBSTONE STYLES (inline) ───────── */
const stoneBodyBase: React.CSSProperties = {
    border: "1px solid rgba(180,180,200,0.15)",
    padding: "14px 10px 10px",
    position: "relative",
    boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.05), inset -2px -2px 4px rgba(0,0,0,0.5), 4px 6px 0px rgba(0,0,0,0.5)",
    width: 90,
    minHeight: 95,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
};

const shapeStyles: Record<string, React.CSSProperties> = {
    "shape-arch": { borderRadius: "55px 55px 0 0" },
    "shape-cross": {
        clipPath: "polygon(35% 0%, 65% 0%, 65% 30%, 100% 30%, 100% 55%, 65% 55%, 65% 100%, 35% 100%, 35% 55%, 0% 55%, 0% 30%, 35% 30%)",
        minHeight: 130,
        padding: "8px",
    },
    "shape-obelisk": {
        clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)",
        borderRadius: 0,
        paddingTop: 22,
    },
    "shape-broken": {
        clipPath: "polygon(0% 0%, 60% 0%, 75% 15%, 100% 10%, 100% 100%, 0% 100%)",
    },
    "shape-winged": {
        borderRadius: "55px 55px 0 0",
    },
};

/* ───────── GRAVE (CSS-styled HTML in 3D) ───────── */
function Grave({ startup, position, index, onHover, onClick }: GraveProps) {
    const groupRef = useRef<THREE.Group>(null);
    const [showLabel, setShowLabel] = useState(false);
    const [hovered, setHovered] = useState(false);
    const { camera } = useThree();

    const gradient = useMemo(() => getSectorGradient(startup.sector), [startup.sector]);
    const shapeClass = SHAPE_CLASSES[index % 5];
    const flower = FLOWERS[index % FLOWERS.length];
    const lean = useMemo(() => {
        const rng = seededRandom(index * 7 + 13);
        return (rng() - 0.5) * 4; // degrees
    }, [index]);

    useFrame(() => {
        if (!groupRef.current) return;
        const dist = camera.position.distanceTo(
            new THREE.Vector3(position[0], position[1], position[2])
        );
        const near = dist < 22;
        if (near !== showLabel) setShowLabel(near);
    });

    const handlePointerOver = useCallback(
        (e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
            if (groupRef.current) {
                const pos = new THREE.Vector3();
                groupRef.current.getWorldPosition(pos);
                pos.y += 2;
                pos.project(camera);
                const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;
                onHover(startup, { x, y });
            }
        },
        [startup, onHover, camera]
    );

    const handlePointerOut = useCallback(() => {
        setHovered(false);
        document.body.style.cursor = "crosshair";
        onHover(null, null);
    }, [onHover]);

    const handleClick = useCallback(
        (e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            onClick(startup);
        },
        [startup, onClick]
    );

    return (
        <group
            ref={groupRef}
            position={position}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
        >
            {/* Invisible interaction mesh */}
            <mesh position={[0, 0.7, 0]}>
                <boxGeometry args={[1, 1.6, 0.2]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* CSS tombstone */}
            {showLabel && (
                <Html position={[0, 0.75, 0]} center transform sprite distanceFactor={5.5}>
                    <div
                        onClick={() => onClick(startup)}
                        onMouseEnter={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
                        onMouseLeave={() => { setHovered(false); document.body.style.cursor = "crosshair"; onHover(null, null); }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            transform: `rotate(${lean}deg)`,
                            transition: "transform 0.3s ease",
                            cursor: "pointer",
                            filter: `drop-shadow(-4px 8px 12px rgba(0,0,0,0.8))`,
                            ...(hovered ? { transform: `rotate(${lean}deg) scale(1.08) translateY(-3px)` } : {}),
                        }}
                    >
                        {/* Winged decorations */}
                        {shapeClass === "shape-winged" && (
                            <div style={{ position: "relative", width: 110, height: 0 }}>
                                <span style={{ position: "absolute", top: -10, left: -16, fontSize: 16, transform: "scaleX(-1) rotate(-20deg)", opacity: 0.6 }}>🪶</span>
                                <span style={{ position: "absolute", top: -10, right: -16, fontSize: 16, transform: "rotate(-20deg)", opacity: 0.6 }}>🪶</span>
                            </div>
                        )}

                        {/* Stone body */}
                        <div
                            style={{
                                ...stoneBodyBase,
                                ...shapeStyles[shapeClass],
                                background: gradient,
                            }}
                        >
                            {/* Moss overlay */}
                            <div style={{
                                position: "absolute",
                                bottom: 0, left: 0, right: 0,
                                height: "30%",
                                background: "linear-gradient(to top, rgba(30,60,30,0.5), transparent)",
                                pointerEvents: "none",
                                borderRadius: "inherit",
                            }} />

                            {/* Text */}
                            <span style={{
                                fontFamily: "'UnifrakturMaguntia', cursive",
                                fontSize: 10,
                                color: "#a09060",
                                letterSpacing: 2,
                                display: "block",
                                marginBottom: 5,
                            }}>
                                R.I.P
                            </span>
                            <span style={{
                                fontFamily: "'Special Elite', cursive",
                                fontSize: 7,
                                color: "#c8c8d8",
                                letterSpacing: 1,
                                lineHeight: 1.3,
                                display: "block",
                                textAlign: "center",
                                textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                            }}>
                                {startup.name}
                            </span>
                            <span style={{
                                fontFamily: "'Crimson Text', serif",
                                fontSize: 6,
                                color: "#7a7a8a",
                                letterSpacing: 1,
                                marginTop: 4,
                                display: "block",
                            }}>
                                {startup.start_year} — {startup.end_year}
                            </span>
                            <span style={{
                                fontFamily: "'Crimson Text', serif",
                                fontStyle: "italic",
                                fontSize: 5.5,
                                color: "#888890",
                                marginTop: 3,
                                lineHeight: 1.3,
                                display: "block",
                                textAlign: "center",
                            }}>
                                &quot;{formatFunding(startup.total_funding)} burned&quot;
                            </span>
                        </div>

                        {/* Base plinth */}
                        <div style={{
                            width: 120,
                            height: 12,
                            background: "linear-gradient(to bottom, #3a3a4e, #252530)",
                            boxShadow: "3px 4px 0 rgba(0,0,0,0.6)",
                            border: "1px solid rgba(180,180,200,0.1)",
                        }} />

                        {/* Dirt */}
                        <div style={{
                            width: 130,
                            height: 14,
                            background: "repeating-linear-gradient(90deg, #1a1218 0px, #1a1218 4px, #221520 4px, #221520 8px, #1c1016 8px, #1c1016 12px)",
                            borderRadius: "0 0 4px 4px",
                            marginTop: 1,
                            position: "relative",
                            overflow: "hidden",
                        }}>
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)" }} />
                        </div>

                        {/* Flowers */}
                        <div style={{ fontSize: 11, marginTop: 3, opacity: 0.7 }}>
                            {flower}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

/* ───────── GHOST PARTICLES ───────── */
function GhostParticles() {
    const particlesRef = useRef<THREE.Points>(null);
    const count = 60;

    const [positions, velocities] = useMemo(() => {
        const rng = seededRandom(999);
        const pos = new Float32Array(count * 3);
        const vel = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (rng() - 0.5) * 100;
            pos[i * 3 + 1] = rng() * 5;
            pos[i * 3 + 2] = (rng() - 0.5) * 100;
            vel[i * 3] = (rng() - 0.5) * 0.003;
            vel[i * 3 + 1] = 0.002 + rng() * 0.004;
            vel[i * 3 + 2] = (rng() - 0.5) * 0.003;
        }
        return [pos, vel];
    }, []);

    useFrame(() => {
        if (!particlesRef.current) return;
        const posAttr = particlesRef.current.geometry.attributes.position;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < count; i++) {
            arr[i * 3] += velocities[i * 3];
            arr[i * 3 + 1] += velocities[i * 3 + 1];
            arr[i * 3 + 2] += velocities[i * 3 + 2];
            if (arr[i * 3 + 1] > 8) {
                arr[i * 3 + 1] = 0;
                arr[i * 3] += (Math.random() - 0.5) * 10;
                arr[i * 3 + 2] += (Math.random() - 0.5) * 10;
            }
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
            </bufferGeometry>
            <pointsMaterial color="#c8d0ff" size={0.06} transparent opacity={0.25} sizeAttenuation depthWrite={false} />
        </points>
    );
}

/* ───────── STARS ───────── */
function StarsField() {
    const starsCount = 300;
    const positions = useMemo(() => {
        const rng = seededRandom(777);
        const pos = new Float32Array(starsCount * 3);
        for (let i = 0; i < starsCount; i++) {
            const theta = rng() * Math.PI * 2;
            const phi = rng() * Math.PI * 0.45;
            const r = 80 + rng() * 40;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi) + 15;
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        return pos;
    }, []);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} count={starsCount} />
            </bufferGeometry>
            <pointsMaterial color="#ffffff" size={0.3} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
        </points>
    );
}

/* ───────── MOON ───────── */
function Moon() {
    return (
        <Float speed={0.5} rotationIntensity={0} floatIntensity={0.3}>
            <group position={[40, 30, -50]}>
                <mesh>
                    <sphereGeometry args={[3, 16, 16]} />
                    <meshBasicMaterial color="#fff9e0" />
                </mesh>
                <mesh>
                    <sphereGeometry args={[5, 16, 16]} />
                    <meshBasicMaterial color="#d4c97a" transparent opacity={0.12} />
                </mesh>
            </group>
        </Float>
    );
}

/* ───────── KEYBOARD + MOUSE CAMERA CONTROLS ───────── */
function CameraControls() {
    const { camera, gl } = useThree();
    const keysRef = useRef<Set<string>>(new Set());
    const mouseRef = useRef({ isDown: false, lastX: 0, lastY: 0 });
    const yawRef = useRef(Math.PI);
    const pitchRef = useRef(-0.2);

    useEffect(() => {
        camera.position.set(0, 3, -10);

        const onKeyDown = (e: KeyboardEvent) => {
            keysRef.current.add(e.key.toLowerCase());
            if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        };
        const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
        const onMouseDown = (e: MouseEvent) => {
            mouseRef.current.isDown = true;
            mouseRef.current.lastX = e.clientX;
            mouseRef.current.lastY = e.clientY;
        };
        const onMouseUp = () => { mouseRef.current.isDown = false; };
        const onMouseMove = (e: MouseEvent) => {
            if (!mouseRef.current.isDown) return;
            const dx = e.clientX - mouseRef.current.lastX;
            const dy = e.clientY - mouseRef.current.lastY;
            yawRef.current -= dx * 0.003;
            pitchRef.current -= dy * 0.003;
            pitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 6, pitchRef.current));
            mouseRef.current.lastX = e.clientX;
            mouseRef.current.lastY = e.clientY;
        };
        const onWheel = (e: WheelEvent) => {
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            dir.y = 0;
            dir.normalize();
            camera.position.addScaledVector(dir, -e.deltaY * 0.01);
        };

        const canvas = gl.domElement;
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        canvas.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("wheel", onWheel, { passive: true });

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            canvas.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("wheel", onWheel);
        };
    }, [camera, gl]);

    useFrame((_, delta) => {
        const speed = 8 * delta;
        const keys = keysRef.current;

        const forward = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
        const right = new THREE.Vector3(Math.cos(yawRef.current), 0, -Math.sin(yawRef.current));

        if (keys.has("w") || keys.has("arrowup")) camera.position.addScaledVector(forward, speed);
        if (keys.has("s") || keys.has("arrowdown")) camera.position.addScaledVector(forward, -speed);
        if (keys.has("a") || keys.has("arrowleft")) camera.position.addScaledVector(right, -speed);
        if (keys.has("d") || keys.has("arrowright")) camera.position.addScaledVector(right, speed);

        camera.position.y = THREE.MathUtils.clamp(camera.position.y, 2, 15);

        const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, "YXZ");
        camera.quaternion.setFromEuler(euler);
    });

    return null;
}

/* ───────── PROGRESSIVE GRAVES ───────── */
function ProgressiveGraves({
    allStartups,
    gravePositions,
    onHover,
    onClick,
}: {
    allStartups: Startup[];
    gravePositions: [number, number, number][];
    onHover: GraveProps["onHover"];
    onClick: GraveProps["onClick"];
}) {
    const [count, setCount] = useState(Math.min(30, allStartups.length));
    const frameRef = useRef(0);

    useFrame(() => {
        frameRef.current++;
        if (frameRef.current % 10 === 0 && count < allStartups.length) {
            setCount((c) => Math.min(c + 8, allStartups.length));
        }
    });

    return (
        <>
            {allStartups.slice(0, count).map((startup, i) => (
                <Grave
                    key={startup.id}
                    startup={startup}
                    position={gravePositions[i]}
                    index={i}
                    onHover={onHover}
                    onClick={onClick}
                />
            ))}
        </>
    );
}

/* ───────── MAIN SCENE ───────── */
interface GraveyardSceneProps {
    startups: Startup[];
    onHover: (startup: Startup | null, screenPos: { x: number; y: number } | null) => void;
    onClick: (startup: Startup) => void;
}

function GraveyardScene({ startups, onHover, onClick }: GraveyardSceneProps) {
    const gravePositions = useMemo(() => {
        const rng = seededRandom(123);
        const positions: [number, number, number][] = [];
        const cols = Math.ceil(Math.sqrt(startups.length));
        const spacing = 3.2;
        startups.forEach((_, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = (col - cols / 2) * spacing + (rng() - 0.5) * 0.5;
            const z = row * spacing + (rng() - 0.5) * 0.5;
            positions.push([x, 0, z]);
        });
        return positions;
    }, [startups]);

    const treePositions = useMemo(() => {
        const rng = seededRandom(456);
        const trees: [number, number, number][] = [];
        for (let i = 0; i < 12; i++) {
            const angle = rng() * Math.PI * 2;
            const radius = 25 + rng() * 45;
            trees.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
        }
        return trees;
    }, []);

    return (
        <>
            <ambientLight intensity={0.3} />
            <fog attach="fog" args={["#1a1a2e", 15, 70]} />

            <StarsField />
            <Moon />
            <Ground />
            <GhostParticles />

            {treePositions.map((pos, i) => (
                <DeadTree key={`tree-${i}`} position={pos} seed={i * 31 + 7} />
            ))}

            <ProgressiveGraves
                allStartups={startups}
                gravePositions={gravePositions}
                onHover={onHover}
                onClick={onClick}
            />

            <CameraControls />
        </>
    );
}

/* ───────── MAIN EXPORT ───────── */
export default function GraveyardCanvas({ startups, onHover, onClick }: GraveyardSceneProps) {
    return (
        <div className="canvas-container">
            <Canvas
                camera={{ position: [0, 3, -6], fov: 60, near: 0.1, far: 200 }}
                gl={{ antialias: true, powerPreference: "high-performance" }}
                onCreated={({ gl }) => { gl.setClearColor("#1a1a2e"); }}
            >
                <GraveyardScene startups={startups} onHover={onHover} onClick={onClick} />
            </Canvas>
        </div>
    );
}
