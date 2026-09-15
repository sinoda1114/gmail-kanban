"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Object3D, Scene, WebGLRenderer, PerspectiveCamera, Clock } from "three";
import type { VRM } from "@pixiv/three-vrm";

export const DEFAULT_VRM_MODEL_PATH =
  // Optional VRM override. Live presence defaults to InterviewerAvatar (illustrated interviewer)
  // because VTuber samples like Seed-san read as too casual / robotic for interview practice.
  // To enable VRM: place Sendagaya Shino (CC0) at public/vrm-models/sendagaya-shino.vrm and wire
  // PracticeLivePresence to VRMAvatar with this path.
  "/vrm-models/sendagaya-shino.vrm";

interface VRMAvatarProps {
  /** Written by the live audio monitor; read each frame (no React re-render). */
  audioLevelRef?: RefObject<number>;
  /** When false, mouth stays closed even if the level ref is non-zero. */
  lipSyncActive?: boolean;
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
  deepDispose: (object3D: Object3D) => void;
};

function disposeRenderer(
  renderer: WebGLRenderer,
  container: HTMLDivElement | null
) {
  try {
    if (container && renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
  } catch {
    /* already disposed */
  }
}

function disposeInstances(
  instances: VRMInstances | null,
  container: HTMLDivElement | null
) {
  if (!instances) return;
  const { renderer, vrm, scene, deepDispose } = instances;
  try {
    scene.remove(vrm.scene);
    deepDispose(vrm.scene);
  } catch {
    /* already disposed */
  }
  disposeRenderer(renderer, container);
}

export function VRMAvatar({
  audioLevelRef,
  lipSyncActive = false,
  width = 240,
  height = 320,
  modelPath = DEFAULT_VRM_MODEL_PATH,
  onLoadError,
}: VRMAvatarProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const instancesRef = useRef<VRMInstances | null>(null);
  const lipSyncActiveRef = useRef(lipSyncActive);
  const onLoadErrorRef = useRef(onLoadError);
  const expressionNamesRef = useRef<{ aa: string; ih: string } | null>(null);
  const externalLevelRef = audioLevelRef;

  useEffect(() => {
    lipSyncActiveRef.current = lipSyncActive;
  }, [lipSyncActive]);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    let mounted = true;
    let renderer: WebGLRenderer | null = null;

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

        renderer = new THREE.WebGLRenderer({
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
        const vrm = gltf.userData.vrm as VRM | undefined;
        if (!vrm) {
          VRMUtils.deepDispose(gltf.scene);
          throw new Error("VRM data missing from loaded GLTF");
        }

        if (!mounted) {
          VRMUtils.deepDispose(vrm.scene);
          if (renderer) disposeRenderer(renderer, container);
          renderer = null;
          return;
        }

        VRMUtils.rotateVRM0(vrm);
        scene.add(vrm.scene);

        instancesRef.current = {
          scene,
          renderer,
          camera,
          vrm,
          clock,
          deepDispose: VRMUtils.deepDispose,
        };
        renderer = null;

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
            const raw = externalLevelRef?.current ?? 0;
            const activeLevel = lipSyncActiveRef.current ? raw : 0;
            const smoothedLevel = Math.max(0, Math.min(1, activeLevel * 1.8));
            expressionManager.setValue(names.aa, smoothedLevel * 0.8);
            expressionManager.setValue(names.ih, smoothedLevel * 0.2);
          }

          r.render(s, c);
          rafRef.current = requestAnimationFrame(animate);
        }

        rafRef.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error("Failed to load VRM model:", error);
        if (renderer) {
          disposeRenderer(renderer, container);
          renderer = null;
        }
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
      if (instancesRef.current) {
        disposeInstances(instancesRef.current, container);
        instancesRef.current = null;
      } else if (renderer) {
        disposeRenderer(renderer, container);
        renderer = null;
      }
    };
  }, [modelPath, width, height, externalLevelRef]);

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
