/**
 * Surfboard 3D Reconstruction - TypeScript with Three.js
 * Run: npm install three @types/three && npx tsc
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SurfboardConfig {
  length: number;
  width: number;
  thickness: number;
  color: string;
  fins: number;
  hasPad: boolean;
}

class Surfboard3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private surfboardGroup: THREE.Group;

  constructor() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a2b3c);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(3.2, 1.8, 3.8);
    this.camera.lookAt(0, 0.05, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    document.body.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.autoRotate = false;
    this.controls.target.set(0, 0.05, 0);
    this.controls.update();

    // Lights
    this.setupLights();

    // Build surfboard
    this.surfboardGroup = this.buildSurfboard({
      length: 2.2,
      width: 0.62,
      thickness: 0.12,
      color: '#f0eee0',
      fins: 3,
      hasPad: true,
    });
    this.scene.add(this.surfboardGroup);

    // Environment
    this.addEnvironment();

    // Events
    window.addEventListener('resize', this.onResize.bind(this));

    // Start render loop
    this.animate();
  }

  private setupLights(): void {
    // Ambient
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);

    // Key light
    const key = new THREE.DirectionalLight(0xffeedd, 2.5);
    key.position.set(4, 5, 3);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    // Fill light
    const fill = new THREE.DirectionalLight(0xccddff, 1.2);
    fill.position.set(-3, 1, 4);
    this.scene.add(fill);

    // Rim light
    const rim = new THREE.DirectionalLight(0xffffdd, 0.8);
    rim.position.set(-2, 0.5, -4);
    this.scene.add(rim);

    // Back light
    const back = new THREE.DirectionalLight(0x88aaff, 0.6);
    back.position.set(0, 0.5, -5);
    this.scene.add(back);
  }

  private buildSurfboard(config: SurfboardConfig): THREE.Group {
    const group = new THREE.Group();

    // 1. Main board using LatheGeometry
    const profile: THREE.Vector2[] = [];
    const segments = 30;
    const halfLen = config.length / 2;
    const halfWid = config.width / 2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = -halfLen + t * config.length;
      let r = 0;
      const absY = Math.abs(y);

      if (y < 0) {
        const p = (y + halfLen) / halfLen;
        if (p < 0.15) {
          const q = p / 0.15;
          r = halfWid * (1 - Math.pow(1 - q, 2));
        } else {
          const q = (p - 0.15) / 0.85;
          r = halfWid * (0.92 + 0.08 * Math.sin(q * Math.PI * 0.5));
        }
      } else {
        const p = y / halfLen;
        if (p < 0.7) {
          r = halfWid * (1 - 0.08 * Math.sin(p * Math.PI * 0.3));
        } else {
          const q = (p - 0.7) / 0.3;
          r = halfWid * (0.85 - 0.35 * q * q);
        }
      }
      r = Math.max(r, 0.02);
      profile.push(new THREE.Vector2(r, y));
    }

    const latheGeom = new THREE.LatheGeometry(profile, 24);
    
    // Flatten along Z
    const positions = latheGeom.attributes.position;
    const scaleZ = 0.3;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      positions.setXYZ(i, x, y, z * scaleZ);
    }
    positions.needsUpdate = true;
    latheGeom.computeVertexNormals();

    const boardMat = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.5,
      metalness: 0.05,
      envMapIntensity: 0.2,
    });

    const boardMesh = new THREE.Mesh(latheGeom, boardMat);
    boardMesh.castShadow = true;
    boardMesh.receiveShadow = true;
    boardMesh.rotation.z = -Math.PI / 2;
    group.add(boardMesh);

    // 2. Deck Pad
    if (config.hasPad) {
      const padShape = new THREE.Shape();
      const padW = 0.38;
      const padL = 0.5;
      padShape.moveTo(-padW / 2, -padL / 2);
      padShape.quadraticCurveTo(-padW / 2, padL / 2, 0, padL / 2);
      padShape.quadraticCurveTo(padW / 2, padL / 2, padW / 2, -padL / 2);
      padShape.quadraticCurveTo(padW / 2, -padL / 2, 0, -padL / 2);
      padShape.quadraticCurveTo(-padW / 2, -padL / 2, -padW / 2, -padL / 2);

      const padGeom = new THREE.ShapeGeometry(padShape);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      });

      const padMesh = new THREE.Mesh(padGeom, padMat);
      padMesh.position.set(0.4, 0.12, 0);
      padMesh.rotation.x = -0.1;
      padMesh.rotation.z = 0.05;
      padMesh.scale.set(1, 1, 0.2);
      group.add(padMesh);
    }

    // 3. Stringer
    const stringerMat = new THREE.MeshStandardMaterial({
      color: 0xd4b8a0,
      roughness: 0.6,
      metalness: 0.1,
    });
    const stringerGeom = new THREE.BoxGeometry(0.02, 1.8, 0.01);
    const stringer = new THREE.Mesh(stringerGeom, stringerMat);
    stringer.position.set(0, 0, 0);
    stringer.rotation.z = 0.02;
    group.add(stringer);

    // 4. Fins (thruster setup)
    const finMat = new THREE.MeshStandardMaterial({
      color: 0x3a4a5a,
      roughness: 0.3,
      metalness: 0.4,
      side: THREE.DoubleSide,
    });

    // Center fin
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.15, -0.25);
    finShape.lineTo(-0.05, -0.3);
    finShape.lineTo(-0.12, -0.15);
    finShape.closePath();

    const finGeom = new THREE.ShapeGeometry(finShape);
    const centerFin = new THREE.Mesh(finGeom, finMat);
    centerFin.position.set(-0.75, -0.08, 0);
    centerFin.rotation.x = 0.1;
    centerFin.rotation.z = -0.05;
    centerFin.scale.set(0.8, 0.8, 0.8);
    group.add(centerFin);

    // Side fins
    const sideFinShape = new THREE.Shape();
    sideFinShape.moveTo(0, 0);
    sideFinShape.lineTo(0.08, -0.18);
    sideFinShape.lineTo(-0.03, -0.2);
    sideFinShape.lineTo(-0.07, -0.1);
    sideFinShape.closePath();

    const sideFinGeom = new THREE.ShapeGeometry(sideFinShape);
    [-0.22, 0.22].forEach((z) => {
      const sideFin = new THREE.Mesh(sideFinGeom, finMat);
      sideFin.position.set(-0.65, -0.06, z);
      sideFin.rotation.x = -0.1;
      sideFin.rotation.z = z < 0 ? -0.2 : 0.2;
      sideFin.scale.set(0.6, 0.6, 0.6);
      group.add(sideFin);
    });

    // 5. Rail bands
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xccbbaa,
      roughness: 0.5,
      metalness: 0.1,
    });

    const railGeom = new THREE.BoxGeometry(0.015, 1.6, 0.03);
    [-0.01, 0.01].forEach((z) => {
      const rail = new THREE.Mesh(railGeom, railMat);
      rail.position.set(0.28, 0.0, z);
      rail.rotation.z = 0.02;
      group.add(rail);
    });

    // 6. Leash plug
    const plugMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.2,
      metalness: 0.7,
    });
    const plugGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8);
    const plug = new THREE.Mesh(plugGeom, plugMat);
    plug.position.set(0.82, 0.03, 0);
    plug.rotation.x = Math.PI / 2;
    group.add(plug);

    // 7. Nose guard
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0xddccbb,
      roughness: 0.4,
      metalness: 0.2,
    });
    const noseGeom = new THREE.SphereGeometry(0.08, 8, 8);
    const noseCap = new THREE.Mesh(noseGeom, noseMat);
    noseCap.position.set(1.08, 0.0, 0);
    noseCap.scale.set(0.6, 0.5, 0.3);
    group.add(noseCap);

    // Final adjustments
    group.rotation.x = 0.05;
    group.rotation.z = -0.1;
    group.position.y = 0.1;

    return group;
  }

  private addEnvironment(): void {
    // Grid
    const gridHelper = new THREE.GridHelper(6, 12, 0x88aadd, 0x446688);
    gridHelper.position.y = -0.2;
    this.scene.add(gridHelper);

    // Shadow catcher
    const groundMat = new THREE.ShadowMaterial({
      opacity: 0.3,
    });
    const groundGeom = new THREE.PlaneGeometry(6, 6);
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Ambient particles
    const sparkleMat = new THREE.PointsMaterial({
      color: 0x88aaff,
      size: 0.015,
      transparent: true,
      opacity: 0.3,
    });
    const sparklePos: number[] = [];
    for (let i = 0; i < 40; i++) {
      sparklePos.push(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 3 + 0.5,
        (Math.random() - 0.5) * 6
      );
    }
    const sparkleGeom = new THREE.BufferGeometry();
    sparkleGeom.setAttribute('position', 
      new THREE.Float32BufferAttribute(sparklePos, 3)
    );
    const sparkles = new THREE.Points(sparkleGeom, sparkleMat);
    this.scene.add(sparkles);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Entry point
document.addEventListener('DOMContentLoaded', () => {
  new Surfboard3D();
});
