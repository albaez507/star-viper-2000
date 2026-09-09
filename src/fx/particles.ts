export type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  active: boolean;
};

export class ParticleSystem {
  private particles: Particle[] = [];
  private cursor = 0;
  private readonly capacity: number;

  constructor(capacity = 200) {
    this.capacity = capacity;
    for (let i = 0; i < capacity; i++) {
      this.particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, color: '#fff', active: false });
    }
  }

  burst(x: number, y: number, count: number, color: string, speed = 90): void {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.cursor];
      this.cursor = (this.cursor + 1) % this.capacity;
      const angle = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      p.x = x; p.y = y;
      p.vx = Math.cos(angle) * s;
      p.vy = Math.sin(angle) * s;
      p.life = p.maxLife = 0.25 + Math.random() * 0.25;
      p.size = 1.5 + Math.random() * 2;
      p.color = color;
      p.active = true;
    }
  }

  /**
   * Chorro continuo hacia atrás. `burst` dispersa en todas direcciones, que
   * sirve para explosiones pero no para una tobera: aquí las partículas salen
   * en un cono estrecho hacia la izquierda, con vida corta, para que se lea
   * como llama y no como escombros.
   */
  thruster(x: number, y: number, color: string, fuerza = 1): void {
    const count = fuerza > 1 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.cursor];
      this.cursor = (this.cursor + 1) % this.capacity;
      p.x = x;
      p.y = y + (Math.random() - 0.5) * 5;
      p.vx = -(80 + Math.random() * 80) * fuerza;
      p.vy = (Math.random() - 0.5) * 28;
      p.life = p.maxLife = 0.14 + Math.random() * 0.14;
      p.size = 1.5 + Math.random() * 2;
      p.color = color;
      p.active = true;
    }
  }

  update(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
    }
  }

  active(): Particle[] {
    return this.particles.filter((p) => p.active);
  }
}
