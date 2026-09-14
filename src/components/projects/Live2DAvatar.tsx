"use client";

import { useEffect, useRef } from "react";
import type { Application } from "pixi.js";
import type { Live2DModel } from "pixi-live2d-display";

interface Live2DAvatarProps {
  audioLevel?: number;
  width?: number;
  height?: number;
  modelPath?: string;
}

let pixiAppInstance: Application | null = null;
let live2dModelInstance: Live2DModel | null = null;

export function Live2DAvatar({
  audioLevel = 0,
  width = 240,
  height = 320,
  modelPath = "/live2d-models/Hiyori/Hiyori.model3.json",
}: Live2DAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<Live2DModel | null>(null);
  const rafRef = useRef<number>(0);
  const mouthOpenRef = useRef(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mounted = true;
    let app: Application | null = null;
    let model: Live2DModel | null = null;

    async function initLive2D() {
      if (!canvas || !mounted) return;

      try {
        const { Application } = await import("pixi.js");
        const { Live2DModel } = await import("pixi-live2d-display");

        if (!mounted) return;

        if (pixiAppInstance) {
          app = pixiAppInstance;
        } else {
          app = new Application({
            view: canvas,
            width,
            height,
            backgroundAlpha: 0,
            antialias: true,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
          });
          pixiAppInstance = app;
        }

        if (!mounted) return;

        if (live2dModelInstance) {
          model = live2dModelInstance;
          const stageChildren = app.stage.children as unknown[];
          if (stageChildren.indexOf(model) === -1) {
            app.stage.addChild(model as unknown as Parameters<typeof app.stage.addChild>[0]);
          }
        } else {
          model = await Live2DModel.from(modelPath, {
            autoInteract: false,
          });

          if (!mounted) return;

          live2dModelInstance = model;

          const scaleX = (width * 0.8) / model.width;
          const scaleY = (height * 0.8) / model.height;
          const scale = Math.min(scaleX, scaleY);
          model.scale.set(scale);
          model.x = width / 2;
          model.y = height / 2;
          model.anchor.set(0.5, 0.5);

          app.stage.addChild(model as unknown as Parameters<typeof app.stage.addChild>[0]);
        }

        modelRef.current = model;

        function updateLipSync() {
          if (!mounted || !model) return;

          const now = performance.now();
          const deltaTime = Math.min(now - lastUpdateRef.current, 100) / 1000;
          lastUpdateRef.current = now;

          const targetMouthOpen = Math.max(0, Math.min(1, audioLevel * 2));
          const smoothFactor = Math.min(1, deltaTime * 12);
          mouthOpenRef.current +=
            (targetMouthOpen - mouthOpenRef.current) * smoothFactor;

          const internalModel = model.internalModel;
          if (internalModel && 'coreModel' in internalModel) {
            const coreModel = (internalModel as unknown as Record<string, unknown>).coreModel;
            if (coreModel && typeof coreModel === 'object' && 'setParameterValueById' in coreModel) {
              try {
                const setParamById = coreModel.setParameterValueById as (name: string, value: number) => void;
                setParamById(
                  "ParamMouthOpenY",
                  mouthOpenRef.current
                );
              } catch {
                // Fallback: try setting parameter by index
                try {
                  if ('getParameterIndex' in coreModel && typeof coreModel.getParameterIndex === 'function') {
                    const getParamIndex = coreModel.getParameterIndex as (name: string) => number;
                    const paramIndex = getParamIndex("ParamMouthOpenY");
                    if (typeof paramIndex === "number" && paramIndex >= 0 && 'setParameterValueByIndex' in coreModel) {
                      const setParamByIndex = (coreModel as Record<string, unknown>).setParameterValueByIndex as (index: number, value: number) => void;
                      setParamByIndex(paramIndex, mouthOpenRef.current);
                    }
                  }
                } catch {
                  // Silent fail
                }
              }
            }
          }

          if (mounted) {
            rafRef.current = requestAnimationFrame(updateLipSync);
          }
        }

        lastUpdateRef.current = performance.now();
        rafRef.current = requestAnimationFrame(updateLipSync);
      } catch (error) {
        console.error("Failed to load Live2D model:", error);
      }
    }

    void initLive2D();

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
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        borderRadius: 8,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}
