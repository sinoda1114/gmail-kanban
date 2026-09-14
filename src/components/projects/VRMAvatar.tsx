"use client";

import { useEffect, useRef } from "react";
import type { Scene, WebGLRenderer, PerspectiveCamera, Clock } from "three";
import type { VRM } from "@pixiv/three-vrm";

interface VRMAvatarProps {
  audioLevel?: number;
  width?: number;
  height?: number;
  modelPath?: string;
}

export function VRMAvatar({
  audioLevel = 0,
  width = 240,
  height = 320,
  modelPath = "/vrm-models/sendagaya-shino.vrm",
}: VRMAvatarProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const instancesRef = useRef<{
    scene: Scene;
    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    vrm: VRM;
    clock: Clock;
  } | null>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    let mounted = true;

    async function initVRM() {
      if (!container || !mounted) return;

      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { VRMLoaderPlugin, VRMExpressionPresetName } = await import("@pixiv/three-vrm");

        if (!mounted) return;

        let { scene, renderer, camera, vrm, clock } = instancesRef.current || {};

        if (!renderer) {
          scene = new THREE.Scene();

          camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 20);
          camera.position.set(0, 1.3, 1.5);
          camera.lookAt(0, 1.3, 0);

          const light = new THREE.DirectionalLight(0xffffff, Math.PI);
          light.position.set(1, 1, 1);
          scene.add(light);

          const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
          scene.add(ambientLight);

          renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
          });
          renderer.setSize(width, height);
          renderer.setPixelRatio(window.devicePixelRatio);
          renderer.setClearColor(0x000000, 0);
          container.appendChild(renderer.domElement);

          clock = new THREE.Clock();
        }

        if (!vrm && mounted) {
          const loader = new GLTFLoader();
          loader.register((parser) => new VRMLoaderPlugin(parser));

          const gltf = await loader.loadAsync(modelPath);
          const loadedVrm = gltf.userData.vrm as VRM;

          if (!mounted || !scene) return;

          scene.add(loadedVrm.scene);
          vrm = loadedVrm;
        }

        if (!scene || !renderer || !camera || !vrm || !clock) return;

        instancesRef.current = { scene, renderer, camera, vrm, clock };

        function animate() {
          if (!mounted || !instancesRef.current) return;

          const { scene, renderer, camera, vrm, clock } = instancesRef.current;
          const deltaTime = clock.getDelta();

          if (vrm) {
            vrm.update(deltaTime);

            const expressionManager = vrm.expressionManager;
            if (expressionManager) {
              const smoothedLevel = Math.max(0, Math.min(1, audioLevel * 1.8));
              
              expressionManager.setValue(VRMExpressionPresetName.Aa, smoothedLevel * 0.8);
              expressionManager.setValue(VRMExpressionPresetName.Ih, smoothedLevel * 0.2);
            }
          }

          renderer.render(scene, camera);

          if (mounted) {
            rafRef.current = requestAnimationFrame(animate);
          }
        }

        rafRef.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error("Failed to load VRM model:", error);
      }
    }

    void initVRM();

    return () => {
      mounted = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [modelPath, width, height, audioLevel]);

  return (
    <div
      ref={canvasRef}
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        borderRadius: 8,
      }}
    />
  );
}
