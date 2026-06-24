"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Engineering grid
    const gridHelper = new THREE.GridHelper(1200, 60, 0x1a1d24, 0x1a1d24);
    gridHelper.position.y = -200;
    scene.add(gridHelper);

    // Data flow particles along paths
    const particleCount = 500;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities: { x: number; y: number; z: number; life: number; maxLife: number }[] = [];

    const palette = [
      new THREE.Color("#0d9488"), // teal
      new THREE.Color("#3b82f6"), // blue
      new THREE.Color("#ec4899"), // pink
      new THREE.Color("#f59e0b"), // amber
      new THREE.Color("#8b5cf6"), // purple
      new THREE.Color("#06b6d4"), // cyan
    ];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 500;
      const height = (Math.random() - 0.5) * 400;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 1 + Math.random() * 3;

      velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.3,
        life: Math.random() * 100,
        maxLife: 80 + Math.random() * 120,
      });
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Subtle scan line
    const scanGeo = new THREE.PlaneGeometry(800, 2);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x0070f3,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide,
    });
    const scanLine = new THREE.Mesh(scanGeo, scanMat);
    scanLine.position.y = -100;
    scene.add(scanLine);

    camera.position.set(0, 100, 600);
    camera.lookAt(0, 0, 0);

    let time = 0;
    let frameId: number;

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.005;

      // Rotate particles slowly
      particles.rotation.y += 0.0003;
      particles.rotation.x += 0.0001;

      // Move scan line
      scanLine.position.y = -100 + (Math.sin(time * 0.5) * 200);

      // Update individual particle positions for flow effect
      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const v = velocities[i];
        v.life += 0.02;
        if (v.life > v.maxLife) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 100 + Math.random() * 500;
          pos[i * 3] = Math.cos(angle) * radius;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 400;
          pos[i * 3 + 2] = Math.sin(angle) * radius;
          v.life = 0;
          v.maxLife = 80 + Math.random() * 120;
          continue;
        }
        pos[i * 3] += v.x;
        pos[i * 3 + 1] += v.y;
        pos[i * 3 + 2] += v.z;

        // Contain particles within bounds
        const dist = Math.sqrt(pos[i * 3] ** 2 + pos[i * 3 + 2] ** 2);
        if (dist > 600) {
          pos[i * 3] *= 0.99;
          pos[i * 3 + 2] *= 0.99;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Camera subtle orbit
      camera.position.x = Math.sin(time * 0.1) * 50;
      camera.position.z = 600 + Math.cos(time * 0.15) * 30;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      scanGeo.dispose();
      scanMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
}
