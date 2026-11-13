"use client";

import type Human from "@vladmandic/human";

let instance: Promise<Human> | null = null;

/**
 * Human is only needed when the camera is open. Loading it dynamically keeps
 * its ~10 MB model code out of every other page bundle.
 */
export function loadHuman() {
  instance ??= import("@vladmandic/human").then(
    ({ default: HumanModel }) =>
      new HumanModel({
        modelBasePath: "/models",
        backend: "webgl",
        cacheModels: true,
        // Hanya blazeface + facemesh + faceres yang tersedia di /models.
        // Model lain (body, hand, iris, emotion) WAJIB dimatikan: kalau tidak,
        // human.load() mencoba fetch model yang tidak ada, gagal, lalu tfjs
        // meninggalkan GraphModel tanpa executor →
        // `can't access property "inputs", this.executor is undefined`.
        body: { enabled: false },
        hand: { enabled: false },
        gesture: { enabled: false },
        object: { enabled: false },
        segmentation: { enabled: false },
        face: {
          enabled: true,
          detector: { rotation: true, maxDetected: 1 },
          mesh: { enabled: true },
          iris: { enabled: false },
          emotion: { enabled: false },
          description: { enabled: true },
          antispoof: { enabled: false },
          liveness: { enabled: false },
        },
      }),
  );
  return instance;
}

export async function captureEmbedding(
  source: HTMLVideoElement | HTMLCanvasElement,
) {
  const human = await loadHuman();
  await human.load();
  const result = await human.detect(source);
  const embedding = result.face[0]?.embedding;
  return embedding && embedding.length > 0 ? [...embedding] : null;
}

export async function compareEmbeddings(
  first: number[],
  second: number[],
) {
  const human = await loadHuman();
  return human.match.similarity(first, second);
}
