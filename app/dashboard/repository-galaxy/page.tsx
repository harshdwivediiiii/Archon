"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Search, ZoomIn, ZoomOut, RotateCw, Info, Telescope, Move, Star } from "lucide-react";

const COLORS = {
  bg: "#0a0a0a",
  grid: "#1a1a2e",
  gridLine: "rgba(0, 112, 243, 0.08)",
  core: "#0070f3",
  star: "#e0e2ed",
  starHover: "#60a5fa",
  arm: "rgba(0, 112, 243, 0.15)",
  connection: "rgba(0, 112, 243, 0.12)",
  connectionActive: "rgba(96, 165, 250, 0.4)",
  label: "#c1c6d7",
  accent: "#6807ba",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
};

interface GalaxyStar {
  mesh: THREE.Mesh;
  data: {
    name: string;
    language: string;
    stars: number;
    forks: number;
    description: string;
    health: "healthy" | "warning" | "critical";
  };
  label: THREE.Sprite;
  connections: THREE.Line[];
}

function createTextSprite(
  text: string,
  fontSize = 14,
  bgColor = "rgba(10,10,10,0.85)",
  textColor = "#e0e2ed"
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const size = 256;
  canvas.width = size;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(8, 4, size - 16, 56, 6);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,112,243,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(8, 4, size - 16, 56, 6);
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px "Geist Mono", "SF Mono", "Fira Code", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, size / 2, 34);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4, 1, 1);
  return sprite;
}

function createConnection(
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: string,
  dashed = false
): THREE.Line {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  mid.y += Math.random() * 2 - 1;
  mid.x += Math.random() * 2 - 1;
  mid.z += Math.random() * 2 - 1;

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(32);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  let material: THREE.LineBasicMaterial;
  if (dashed) {
    material = new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      dashSize: 0.08,
      gapSize: 0.08,
      depthWrite: false,
    });
  } else {
    material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    });
  }

  const line = new THREE.Line(geometry, material);
  if (dashed) line.computeLineDistances();
  return line;
}

function createTravelingDot(
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: string
): { dot: THREE.Mesh; update: (t: number) => void } {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  mid.y += Math.random() * 2 - 1;
  mid.x += Math.random() * 2 - 1;
  mid.z += Math.random() * 2 - 1;

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

  const geometry = new THREE.SphereGeometry(0.06, 8, 8);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
  });
  const dot = new THREE.Mesh(geometry, material);

  return {
    dot,
    update(t: number) {
      const pt = curve.getPoint(t);
      dot.position.copy(pt);
      const opacity = t < 0.1 ? t * 10 : t > 0.9 ? (1 - t) * 10 : 1;
      (dot.material as THREE.MeshBasicMaterial).opacity = opacity * 0.8;
    },
  };
}

export default function RepositoryGalaxyPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const starsRef = useRef<GalaxyStar[]>([]);
  const travelingDotsRef = useRef<{ dot: THREE.Mesh; update: (t: number) => void; t: number; speed: number }[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const hoveredRef = useRef<GalaxyStar | null>(null);
  const animFrameRef = useRef<number>(0);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  const [selectedStar, setSelectedStar] = useState<GalaxyStar["data"] | null>(null);
  const [hoveredStar, setHoveredStar] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [starCount, setStarCount] = useState(0);
  const [starList, setStarList] = useState<GalaxyStar["data"][]>([]);

  const generateGalaxyData = useCallback(() => {
    const repos = [
      { name: "archon-core", language: "TypeScript", stars: 2847, forks: 423, description: "Core AI orchestration engine", health: "healthy" as const },
      { name: "archon-frontend", language: "TypeScript", stars: 1562, forks: 234, description: "React/Next.js dashboard", health: "healthy" as const },
      { name: "archon-api", language: "Go", stars: 982, forks: 156, description: "High-performance API gateway", health: "healthy" as const },
      { name: "archon-ml", language: "Python", stars: 2134, forks: 389, description: "ML pipeline and model serving", health: "healthy" as const },
      { name: "archon-infra", language: "HCL", stars: 567, forks: 98, description: "Terraform infrastructure as code", health: "warning" as const },
      { name: "archon-docs", language: "Markdown", stars: 345, forks: 67, description: "Documentation and design specs", health: "healthy" as const },
      { name: "archon-sdk", language: "TypeScript", stars: 789, forks: 134, description: "Client SDK and tooling", health: "healthy" as const },
      { name: "archon-worker", language: "Rust", stars: 456, forks: 78, description: "Background job processor", health: "critical" as const },
      { name: "archon-db", language: "SQL", stars: 234, forks: 45, description: "Database migrations and schemas", health: "healthy" as const },
      { name: "archon-auth", language: "Go", stars: 678, forks: 112, description: "Authentication and authorization", health: "healthy" as const },
      { name: "archon-search", language: "Python", stars: 345, forks: 56, description: "Vector search and indexing", health: "warning" as const },
      { name: "archon-mobile", language: "Dart", stars: 234, forks: 34, description: "Flutter mobile application", health: "healthy" as const },
      { name: "archon-cli", language: "Rust", stars: 567, forks: 89, description: "Command-line interface", health: "healthy" as const },
      { name: "archon-test", language: "TypeScript", stars: 123, forks: 23, description: "E2E test suite and QA", health: "healthy" as const },
      { name: "archon-bench", language: "Python", stars: 89, forks: 12, description: "Performance benchmarks", health: "warning" as const },
      { name: "archon-analytics", language: "Python", stars: 456, forks: 67, description: "Usage analytics and metrics", health: "healthy" as const },
      { name: "archon-deploy", language: "HCL", stars: 234, forks: 45, description: "Deployment automation", health: "healthy" as const },
      { name: "archon-monitor", language: "Go", stars: 345, forks: 56, description: "Monitoring and alerting", health: "critical" as const },
      { name: "archon-dns", language: "Go", stars: 123, forks: 23, description: "DNS and routing management", health: "healthy" as const },
      { name: "archon-cache", language: "Rust", stars: 456, forks: 78, description: "Distributed caching layer", health: "healthy" as const },
      { name: "archon-queue", language: "Go", stars: 345, forks: 56, description: "Message queue and event bus", health: "healthy" as const },
      { name: "archon-storage", language: "Rust", stars: 567, forks: 89, description: "Object storage abstraction", health: "warning" as const },
      { name: "archon-graphql", language: "TypeScript", stars: 234, forks: 34, description: "GraphQL federation gateway", health: "healthy" as const },
      { name: "archon-grpc", language: "Go", stars: 345, forks: 56, description: "gRPC service definitions", health: "healthy" as const },
      { name: "archon-proto", language: "Protobuf", stars: 123, forks: 23, description: "Protocol buffer definitions", health: "healthy" as const },
      { name: "archon-webhook", language: "TypeScript", stars: 89, forks: 12, description: "Webhook event handler", health: "warning" as const },
      { name: "archon-cdn", language: "HCL", stars: 67, forks: 11, description: "CDN and edge configuration", health: "healthy" as const },
      { name: "archon-secret", language: "Go", stars: 234, forks: 34, description: "Secrets management", health: "critical" as const },
      { name: "archon-feature", language: "TypeScript", stars: 345, forks: 56, description: "Feature flag service", health: "healthy" as const },
      { name: "archon-config", language: "Go", stars: 456, forks: 67, description: "Configuration management", health: "healthy" as const },
    ];
    return repos;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(8, 6, 15);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 50;
    controls.minDistance = 3;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x0070f3, 1.2);
    dirLight.position.set(10, 20, 5);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x6807ba, 0.4);
    fillLight.position.set(-10, -5, -10);
    scene.add(fillLight);

    // --- Starfield background ---
    const starGeometry = new THREE.BufferGeometry();
    const starCount_bg = 3000;
    const positions = new Float32Array(starCount_bg * 3);
    const starSizes = new Float32Array(starCount_bg);
    for (let i = 0; i < starCount_bg; i++) {
      const radius = 40 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      starSizes[i] = 0.05 + Math.random() * 0.1;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));

    const starMaterialBg = new THREE.PointsMaterial({
      color: 0x4a5568,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starGeometry, starMaterialBg);
    scene.add(starField);

    // --- Engineering Grid ---
    const gridHelper = new THREE.GridHelper(30, 30, 0x0070f3, 0x1a1a3e);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.15;
    gridHelper.position.y = -3;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Inner glow ring
    const ringGeo = new THREE.RingGeometry(1.5, 2.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0070f3,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2.9;
    scene.add(ring);

    // Outer glow ring
    const ringGeo2 = new THREE.RingGeometry(3, 4.5, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x6807ba,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = -2.9;
    scene.add(ring2);

    // --- Core sphere (central AI engine) ---
    const coreGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0070f3,
      emissive: 0x0070f3,
      emissiveIntensity: 0.4,
      metalness: 0.6,
      roughness: 0.2,
      envMapIntensity: 0.5,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Core glow
    const glowGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x0070f3,
      transparent: true,
      opacity: 0.1,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    // Core label
    const coreLabel = createTextSprite("ARCHON CORE", 16, "rgba(0,112,243,0.2)", "#60a5fa");
    coreLabel.position.set(0, 1.5, 0);
    coreLabel.scale.set(5, 1.2, 1);
    scene.add(coreLabel);

    // --- Generate spiral galaxy stars ---
    const repos = generateGalaxyData();
    const starObjects: GalaxyStar[] = [];
    const armCount = 3;
    const starPositions: THREE.Vector3[] = [];

    repos.forEach((repo, index) => {
      const armIndex = index % armCount;
      const armAngle = (armIndex / armCount) * Math.PI * 2;
      const distance = 1.5 + (index / repos.length) * 6;
      const angle = armAngle + distance * 0.8 + (Math.random() - 0.5) * 0.3;

      const x = Math.cos(angle) * distance + (Math.random() - 0.5) * 0.4;
      const z = Math.sin(angle) * distance + (Math.random() - 0.5) * 0.4;
      const y = (Math.random() - 0.5) * 0.6;

      const position = new THREE.Vector3(x, y, z);
      starPositions.push(position);

      // Star color based on language
      const langColors: Record<string, number> = {
        TypeScript: 0x0070f3,
        Go: 0x00bcd4,
        Python: 0x10b981,
        Rust: 0xf59e0b,
        HCL: 0x8b5cf6,
        Markdown: 0x64748b,
        SQL: 0xef4444,
        Dart: 0x0891b2,
        Protobuf: 0xec4899,
      };
      const langColor = langColors[repo.language] || 0x60a5fa;

      // Health indicator glow
      const healthColor = repo.health === "healthy" ? 0x10b981 : repo.health === "warning" ? 0xf59e0b : 0xef4444;

      const size = 0.08 + (repo.stars / 3000) * 0.2;

      const meshGeo = new THREE.SphereGeometry(size, 16, 16);
      const meshMat = new THREE.MeshPhysicalMaterial({
        color: langColor,
        emissive: langColor,
        emissiveIntensity: 0.3 + (repo.stars / 3000) * 0.4,
        metalness: 0.3,
        roughness: 0.5,
      });
      const mesh = new THREE.Mesh(meshGeo, meshMat);
      mesh.position.copy(position);
      mesh.userData = { index, repo, originalSize: size };
      scene.add(mesh);

      // Health pulse ring
      const pulseGeo = new THREE.RingGeometry(size * 1.5, size * 2.5, 16);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: healthColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      pulse.position.copy(position);
      pulse.lookAt(camera.position);
      scene.add(pulse);
      mesh.userData.pulseRing = pulse;

      // Label
      const label = createTextSprite(
        `${repo.name}  ⚡${repo.stars}`,
        13,
        "rgba(10,10,10,0.8)",
        repo.health === "critical" ? "#ef4444" : repo.health === "warning" ? "#f59e0b" : "#e0e2ed"
      );
      label.position.set(position.x, position.y + 0.6, position.z);
      label.scale.set(3.5, 0.9, 1);
      scene.add(label);

      // Connections to nearby repos
      const connections: THREE.Line[] = [];
      if (index > 0) {
        const prevIndex = Math.max(0, index - (1 + Math.floor(Math.random() * 2)));
        const prevPos = starPositions[prevIndex];
        if (prevPos) {
          const conn = createConnection(position, prevPos, "#0070f3");
          scene.add(conn);
          connections.push(conn);

          // Traveling dot
          if (Math.random() > 0.5) {
            const { dot, update } = createTravelingDot(position, prevPos, "#60a5fa");
            scene.add(dot);
            travelingDotsRef.current.push({ dot, update, t: Math.random(), speed: 0.002 + Math.random() * 0.003 });
          }
        }
      }

      // Random long connections
      if (index % 3 === 0 && index > 2) {
        const targetIdx = Math.floor(Math.random() * index);
        const targetPos = starPositions[targetIdx];
        if (targetPos && targetPos !== position) {
          const conn = createConnection(position, targetPos, "#6807ba", true);
          scene.add(conn);
          connections.push(conn);

          const { dot, update } = createTravelingDot(position, targetPos, "#a78bfa");
          scene.add(dot);
          travelingDotsRef.current.push({ dot, update, t: Math.random(), speed: 0.001 + Math.random() * 0.002 });
        }
      }

      starObjects.push({ mesh, data: repo, label, connections });
    });

    starsRef.current = starObjects;
    setStarCount(repos.length);
    setStarList(repos.map((r) => ({ name: r.name, language: r.language, stars: r.stars, forks: r.forks, description: r.description, health: r.health })));

    // --- Raycaster mouse move ---
    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    renderer.domElement.addEventListener("mousemove", handleMouseMove);

    // --- Click handler ---
    const handleClick = () => {
      if (hoveredRef.current) {
        setSelectedStar(hoveredRef.current.data);
      } else {
        setSelectedStar(null);
      }
    };
    renderer.domElement.addEventListener("click", handleClick);

    // --- Resize ---
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // --- Animation loop ---
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Core pulse
      const pulseScale = 1 + Math.sin(elapsed * 1.5) * 0.05;
      core.scale.set(pulseScale, pulseScale, pulseScale);
      glow.scale.set(pulseScale * 1.2, pulseScale * 1.2, pulseScale * 1.2);
      glowMat.opacity = 0.08 + Math.sin(elapsed * 1.5) * 0.04;

      // Star pulsing
      starObjects.forEach((star, i) => {
        const mesh = star.mesh;
        const data = mesh.userData;
        const pulse = Math.sin(elapsed * 0.8 + i * 0.5) * 0.15 + 0.85;
        const s = data.originalSize * pulse;
        mesh.scale.set(s / data.originalSize, s / data.originalSize, s / data.originalSize);

        // Pulse ring
        if (data.pulseRing) {
          const ringPulse = ((elapsed * 0.5 + i * 0.3) % 1);
          const ringScale = 1 + ringPulse * 3;
          data.pulseRing.scale.set(ringScale, ringScale, ringScale);
          data.pulseRing.material.opacity = 0.3 * (1 - ringPulse);
          data.pulseRing.lookAt(camera.position);
        }
      });

      // Traveling dots
      travelingDotsRef.current.forEach((td) => {
        td.t += td.speed;
        if (td.t > 1) td.t = 0;
        td.update(td.t);
      });

      // Hover detection
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const meshes = starObjects.map((s) => s.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes);

      let hit: GalaxyStar | null = null;
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const found = starObjects.find((s) => s.mesh === hitMesh);
        if (found) hit = found;
      }

      if (hit !== hoveredRef.current) {
        if (hoveredRef.current) {
          const mat = hoveredRef.current.mesh.material as THREE.MeshPhysicalMaterial;
          mat.emissiveIntensity = 0.3;
        }
        hoveredRef.current = hit;
        if (hit) {
          const mat = hit.mesh.material as THREE.MeshPhysicalMaterial;
          mat.emissiveIntensity = 1.0;
          mat.color.setHex(0x60a5fa);
          setHoveredStar(hit.data.name);
          renderer.domElement.style.cursor = "pointer";
        } else {
          setHoveredStar(null);
          renderer.domElement.style.cursor = "default";
        }
      }

      controls.update();
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      renderer.domElement.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [generateGalaxyData]);

  const handleZoomIn = () => {
    if (controlsRef.current && cameraRef.current) {
      const dir = new THREE.Vector3().subVectors(
        controlsRef.current.target,
        cameraRef.current.position
      ).normalize();
      cameraRef.current.position.add(dir.multiplyScalar(1));
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current && cameraRef.current) {
      const dir = new THREE.Vector3().subVectors(
        controlsRef.current.target,
        cameraRef.current.position
      ).normalize();
      cameraRef.current.position.sub(dir.multiplyScalar(1));
    }
  };

  const toggleRotation = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
      setIsRotating(controlsRef.current.autoRotate);
    }
  };

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(8, 6, 15);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const focusOnStar = (name: string) => {
    const star = starsRef.current.find((s) => s.data.name === name);
    if (star && cameraRef.current && controlsRef.current) {
      const pos = star.mesh.position.clone();
      controlsRef.current.target.copy(pos);
      cameraRef.current.position.set(pos.x + 3, pos.y + 2, pos.z + 3);
      controlsRef.current.update();
      setSelectedStar(star.data);
    }
  };

  const filteredStars = starList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
      {/* Three.js Canvas */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Top Controls */}
      <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#1a1a2e] bg-[#0a0a0a]/80 px-4 py-2 backdrop-blur-xl">
            <Telescope className="h-4 w-4 text-[#0070f3]" />
            <span className="text-sm font-semibold text-[#e0e2ed]">Repository Galaxy</span>
            <span className="rounded-md bg-[#0070f3]/10 px-2 py-0.5 text-xs text-[#60a5fa]">
              {starCount} stars
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center rounded-lg border border-[#1a1a2e] bg-[#0a0a0a]/80 backdrop-blur-xl">
            <Search className="absolute left-3 h-3.5 w-3.5 text-[#c1c6d7]" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 bg-transparent py-2 pl-9 pr-3 text-sm text-[#e0e2ed] placeholder-[#c1c6d7] focus:outline-none"
            />
          </div>

          <button
            onClick={toggleRotation}
            className={`rounded-lg border p-2 transition-colors ${
              isRotating
                ? "border-[#0070f3] bg-[#0070f3]/10 text-[#60a5fa]"
                : "border-[#1a1a2e] text-[#c1c6d7] hover:border-[#414754] hover:text-[#e0e2ed]"
            }`}
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="rounded-lg border border-[#1a1a2e] p-2 text-[#c1c6d7] transition-colors hover:border-[#414754] hover:text-[#e0e2ed]"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="rounded-lg border border-[#1a1a2e] p-2 text-[#c1c6d7] transition-colors hover:border-[#414754] hover:text-[#e0e2ed]"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={resetCamera}
            className="rounded-lg border border-[#1a1a2e] p-2 text-[#c1c6d7] transition-colors hover:border-[#414754] hover:text-[#e0e2ed]"
          >
            <Move className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search results list */}
      {searchQuery && (
        <div className="absolute left-4 top-16 z-10 max-h-80 w-72 overflow-y-auto rounded-xl border border-[#1a1a2e] bg-[#0a0a0a]/90 backdrop-blur-xl">
          {filteredStars.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[#c1c6d7]">No repositories found</div>
          ) : (
            filteredStars.map((star) => (
              <button
                key={star.name}
                onClick={() => {
                  focusOnStar(star.name);
                  setSearchQuery("");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#e0e2ed] transition-colors hover:bg-[#0070f3]/10"
              >
                <Star className="h-3.5 w-3.5 shrink-0 text-[#0070f3]" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{star.name}</div>
                  <div className="text-xs text-[#c1c6d7]">
                    {star.language} · {star.stars} stars
                  </div>
                </div>
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    star.health === "healthy"
                      ? "bg-[#10b981]"
                      : star.health === "warning"
                        ? "bg-[#f59e0b]"
                        : "bg-[#ef4444]"
                  }`}
                />
              </button>
            ))
          )}
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredStar && !selectedStar && (
        <div className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-[#1a1a2e] bg-[#0a0a0a]/90 px-4 py-2 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-[#e0e2ed]">
            <Info className="h-3.5 w-3.5 text-[#0070f3]" />
            <span>{hoveredStar}</span>
            <span className="text-[#c1c6d7]">· Click to inspect</span>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedStar && (
        <div className="absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-2xl">
          <div className="rounded-xl border border-[#1a1a2e] bg-[#0a0a0a]/90 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0070f3]/10">
                  <Telescope className="h-5 w-5 text-[#0070f3]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#e0e2ed]">{selectedStar.name}</h3>
                  <p className="text-sm text-[#c1c6d7]">{selectedStar.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStar(null)}
                className="rounded-lg p-1.5 text-[#c1c6d7] transition-colors hover:bg-[#1a1a2e] hover:text-[#e0e2ed]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg border border-[#1a1a2e] bg-[#0a0a0a]/60 p-3">
                <div className="text-xs text-[#c1c6d7]">Language</div>
                <div className="mt-1 text-sm font-medium text-[#e0e2ed]">{selectedStar.language}</div>
              </div>
              <div className="rounded-lg border border-[#1a1a2e] bg-[#0a0a0a]/60 p-3">
                <div className="text-xs text-[#c1c6d7]">Stars</div>
                <div className="mt-1 text-sm font-medium text-[#e0e2ed]">{selectedStar.stars.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-[#1a1a2e] bg-[#0a0a0a]/60 p-3">
                <div className="text-xs text-[#c1c6d7]">Forks</div>
                <div className="mt-1 text-sm font-medium text-[#e0e2ed]">{selectedStar.forks.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-[#1a1a2e] bg-[#0a0a0a]/60 p-3">
                <div className="text-xs text-[#c1c6d7]">Health</div>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#e0e2ed]">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      selectedStar.health === "healthy"
                        ? "bg-[#10b981]"
                        : selectedStar.health === "warning"
                          ? "bg-[#f59e0b]"
                          : "bg-[#ef4444]"
                    }`}
                  />
                  {selectedStar.health.charAt(0).toUpperCase() + selectedStar.health.slice(1)}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-[#c1c6d7]">
              <span className="text-[#414754]">Drag to orbit · Scroll to zoom · Click another star to inspect</span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions badge */}
      {!selectedStar && !hoveredStar && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-[#1a1a2e] bg-[#0a0a0a]/80 px-4 py-2 text-xs text-[#c1c6d7] backdrop-blur-xl">
            <Move className="h-3 w-3" />
            <span>Drag to explore · Click a star to inspect</span>
          </div>
        </div>
      )}
    </div>
  );
}
