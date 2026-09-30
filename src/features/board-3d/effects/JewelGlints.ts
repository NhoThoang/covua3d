import * as THREE from 'three';

export class JewelGlints {
  public points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private count = 300;

  constructor() {
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.count * 3);
    const phases = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      // Scatter glints across the 8x8 board area around piece heights
      positions[i * 3] = (Math.random() - 0.5) * 7.5;
      positions[i * 3 + 1] = 0.2 + Math.random() * 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 7.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float phase;
        uniform float time;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float pulse = pow(max(0.0, sin(time * 1.8 + phase)), 16.0);
          vAlpha = pulse;
          gl_PointSize = clamp(24.0 * pulse / -mv.z, 2.0, 36.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 p = abs(gl_PointCoord - 0.5) * 2.0;
          float core = exp(-dot(p, p) * 24.0);
          float cross = exp(-min(p.x, p.y) * 50.0) * (1.0 - max(p.x, p.y));
          float a = (core + cross * 0.8) * vAlpha;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vec3(1.0, 0.92, 0.72) * 1.6, a);
        }
      `,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  public update(time: number) {
    this.material.uniforms.time.value = time;
  }
}
