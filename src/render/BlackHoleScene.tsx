/**
 * Full-screen black hole renderer.
 *
 * Renders a single quad whose fragment shader integrates Schwarzschild
 * null geodesics (see shaders.ts). Camera orbit via pointer drag,
 * zoom via wheel/pinch. Quality adapts to measured frame time.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders';

export interface SceneParams {
  /** Disk inner radius in units of r_s (Kerr ISCO / r_s). */
  diskInnerRs: number;
  /** Disk outer radius in units of r_s. */
  diskOuterRs: number;
  /** Peak disk temperature in Kelvin (sets the disk color physically). */
  diskTempK: number;
  /** Dimensionless spin a* (visual asymmetry + ISCO already folded in). */
  spin: number;
  /** Accretion brightness 0–2. */
  accretion: number;
  /** Relativistic beaming on/off (educational toggle). */
  beaming: boolean;
  /** Camera distance in r_s. */
  camDist: number;
}

export function BlackHoleScene({ params }: { params: SceneParams }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const mount = mountRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    const maxDpr = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(maxDpr);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms: Record<string, THREE.IUniform> = {
      uResolution: { value: new THREE.Vector2(mount.clientWidth * maxDpr, mount.clientHeight * maxDpr) },
      uTime: { value: 0 },
      uCamDist: { value: 18 },
      uCamTheta: { value: 0.18 },
      uCamPhi: { value: 0 },
      uDiskInner: { value: 3 },
      uDiskOuter: { value: 14 },
      uAccretion: { value: 1 },
      uDiskTempK: { value: 6500 },
      uSpin: { value: 0 },
      uExposure: { value: 1.0 },
      uSteps: { value: 320 },
      uBeaming: { value: 1 },
    };

    const material = new THREE.RawShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // ---- interaction ----------------------------------------------------
    let dragging = false;
    let lastX = 0, lastY = 0;
    let theta = 0.18, phi = 0.6;
    let targetDist = paramsRef.current.camDist;

    const onDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY; };
    const onUp = () => { dragging = false; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      phi += (e.clientX - lastX) * 0.004;
      theta = Math.min(Math.max(theta + (e.clientY - lastY) * 0.004, -1.45), 1.45);
      lastX = e.clientX; lastY = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetDist = Math.min(Math.max(targetDist * Math.exp(e.deltaY * 0.001), 3.2), 120);
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      uniforms.uResolution.value.set(mount.clientWidth * maxDpr, mount.clientHeight * maxDpr);
    };
    window.addEventListener('resize', onResize);

    // ---- adaptive quality ------------------------------------------------
    let smoothedDt = 16;
    let camDistCurrent = targetDist;
    let raf = 0;
    const clock = new THREE.Clock();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta() * 1000, 100);
      smoothedDt = smoothedDt * 0.95 + dt * 0.05;
      // scale geodesic steps to hold ~60fps
      const steps = uniforms.uSteps.value as number;
      if (smoothedDt > 22 && steps > 128) uniforms.uSteps.value = steps - 4;
      else if (smoothedDt < 12 && steps < 384) uniforms.uSteps.value = steps + 2;

      const p = paramsRef.current;
      // external dist changes (slider) vs wheel — reconcile smoothly
      if (Math.abs(p.camDist - lastParamDist) > 1e-6) {
        targetDist = p.camDist;
        lastParamDist = p.camDist;
      }
      camDistCurrent += (targetDist - camDistCurrent) * 0.08;

      uniforms.uTime.value += dt / 1000;
      uniforms.uCamDist.value = camDistCurrent;
      uniforms.uCamTheta.value = theta;
      uniforms.uCamPhi.value = phi + 0.008 * (uniforms.uTime.value as number) * (dragging ? 0 : 1);
      uniforms.uDiskInner.value = p.diskInnerRs;
      uniforms.uDiskOuter.value = p.diskOuterRs;
      uniforms.uDiskTempK.value = p.diskTempK;
      uniforms.uSpin.value = p.spin;
      uniforms.uAccretion.value = p.accretion;
      uniforms.uBeaming.value = p.beaming ? 1 : 0;

      renderer.render(scene, camera);
    };
    let lastParamDist = paramsRef.current.camDist;
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('wheel', onWheel);
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="scene-mount" />;
}
