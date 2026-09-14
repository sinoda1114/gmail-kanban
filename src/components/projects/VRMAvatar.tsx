"use client";

import { useEffect, useRef } from "react";
import type { Scene, WebGLRenderer, PerspectiveCamera, Clock } from "three";
import type { VRM } from "@pixiv/three-vrm";

interface VRMAvatarProps {
  audioLevel?: number;
  width?: number;
  height?: number;
  modelPath?: string;
  onLoadError?: () => void;
}

type VRMInstances = {
  scene: Scene;
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  vrm: VRM;
  clock: Clock;
};

function disposeInstances(instances: VRMInstances | null, container: HTMLDivElement | null) {
  if (!instances) return;
  const { renderer, vrm, scene } = instances;
  try {
    scene.remove(vrm.scene);
    vrm.scene.traverse((obj) => {
      const mesh = obj as { geometry?: { dispose: () => void }; material?: { dispose: () => void } | Array<{ dispose: () => void }> };
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        for (const mat of mesh.material) mat.dispose();
      } else {
        mesh.material?.dispose();
      }
    });
  } catch {
    /* already disposed */
  }
  try {
    if (container && renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
  } catch {
    /* already disposed */
  }
}

export function VRMAvatar({
  audioLevel = 0,
  width = 240,
  height = 320,
  modelPath = "/vrm-models/sendagaya-shino.vrm",
  onLoadError,
}: VRMAvatarProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const instancesRef = useRef<VRMInstances | null>(null);
  const audioLevelRef = useRef(audioLevel);
  const onLoadErrorRef = useRef(onLoadError);
  const expressionNamesRef = useRef<{ aa: string; ih: string } | null>(null);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    let mounted = true;

    async function initVRM() {
      if (!container || !mounted) return;

      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js"
        );
        const { VRMLoaderPlugin, VRMUtils, VRMExpressionPresetName } =
          await import("@pixiv/three-vrm");

        if (!mounted) return;

        expressionNamesRef.current = {
          aa: VRMExpressionPresetName.Aa,
          ih: VRMExpressionPresetName.Ih,
        };

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 20);
        camera.position.set(0, 1.3, 1.5);
        camera.lookAt(0, 1.3, 0);

        const light = new THREE.DirectionalLight(0xffffff, Math.PI);
        light.position.set(1, 1, 1);
        scene.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const clock = new THREE.Clock();

        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        const gltf = await loader.loadAsync(modelPath);
        if (!mounted) {
          renderer.dispose();
          if (renderer.domElement.parentElement === container) {
            container.removeChild(renderer.domElement);
          }
          return;
        }

        const vrm = gltf.userData.vrm as VRM;
        VRMUtils.rotateVRM0(vrm);
        scene.add(vrm.scene);

        instancesRef.current = { scene, renderer, camera, vrm, clock };

        function animate() {
          if (!mounted || !instancesRef.current) return;

          const {
            scene: s,
            renderer: r,
            camera: c,
            vrm: currentVrm,
            clock: cl,
          } = instancesRef.current;
          const deltaTime = cl.getDelta();

          currentVrm.update(deltaTime);

          const expressionManager = currentVrm.expressionManager;
          const names = expressionNamesRef.current;
          if (expressionManager && names) {
            const smoothedLevel = Math.max(
              0,
              Math.min(1, audioLevelRef.current * 1.8)
            );
            expressionManager.setValue(names.aa, smoothedLevel * 0.8);
            expressionManager.setValue(names.ih, smoothedLevel * 0.2);
          }

          r.render(s, c);
          rafRef.current = requestAnimationFrame(animate);
        }

        rafRef.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error("Failed to load VRM model:", error);
        if (mounted) onLoadErrorRef.current?.();
      }
    }

    void initVRM();

    return () => {
      mounted = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      disposeInstances(instancesRef.current, container);
      instancesRef.current = null;
    };
  }, [modelPath, width, height]);

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
