/**
 * Mando USB genérico.
 *
 * El navegador NO avisa cuando se pulsa un botón: hay que preguntar el estado
 * entero en cada frame con `navigator.getGamepads()`. Y por seguridad no
 * devuelve nada hasta que el usuario pulsa algo, así que un mando conectado
 * pero quieto es invisible: no es un fallo, es la API.
 *
 * Los mandos baratos suelen reportar `mapping: ''` en vez de `'standard'`, o
 * sea que los índices de botones y ejes son los que el fabricante quiso. Por
 * eso aquí no se confía en ningún índice concreto: se leen las tres formas en
 * que puede llegar una dirección y se acepta la que responda.
 */

/** Los sticks baratos nunca descansan en 0 exacto; sin esto la nave deriva. */
const ZONA_MUERTA = 0.35;

export class GamepadSource {
  up = false; down = false; left = false; right = false;
  fire = false; missile = false; power = false;
  dash = false; charge = false; detonate = false;
  start = false; pauseToggle = false;

  /** Nombre del mando conectado, o null. Solo para avisar en pantalla. */
  connected: string | null = null;

  update(): void {
    const pads = navigator.getGamepads?.() ?? [];
    const pad = Array.from(pads).find((p): p is Gamepad => !!p && p.connected);

    if (!pad) {
      this.connected = null;
      this.up = this.down = this.left = this.right = false;
      this.fire = this.missile = this.power = false;
      this.dash = this.charge = this.detonate = false;
      this.start = this.pauseToggle = false;
      return;
    }
    this.connected = pad.id;

    const btn = (i: number): boolean => pad.buttons[i]?.pressed ?? false;
    const eje = (i: number): number => pad.axes[i] ?? 0;

    // 1) Cruceta como botones (mapeo estándar: 12=arriba .. 15=derecha).
    // 2) Stick analógico en los ejes 0 y 1.
    // 3) "Hat": muchos mandos DirectInput mandan la cruceta en un eje suelto
    //    (normalmente el 9) codificando 8 direcciones en un solo número.
    const hat = this.leerHat(pad);

    this.up = btn(12) || eje(1) < -ZONA_MUERTA || hat.up;
    this.down = btn(13) || eje(1) > ZONA_MUERTA || hat.down;
    this.left = btn(14) || eje(0) < -ZONA_MUERTA || hat.left;
    this.right = btn(15) || eje(0) > ZONA_MUERTA || hat.right;

    // Los botones de cara disparan y lanzan; no se puede saber cuál es "A"
    // en un mando genérico, así que sobran a propósito.
    this.fire = btn(0) || btn(2);
    this.missile = btn(1);
    this.detonate = btn(3);
    // Los gatillos: L dashea, R carga. El dash va al índice izquierdo
    // porque es lo que se pulsa en pánico sin soltar el disparo; la carga va
    // al derecho porque se mantiene un segundo y luego se suelta.
    this.dash = btn(4) || btn(6);
    this.charge = btn(5) || btn(7);
    this.power = btn(10) || btn(11);

    this.start = btn(9) || btn(0);
    this.pauseToggle = btn(8) || btn(9);
  }

  /**
   * Ejes que hemos identificado como "hat" de verdad, no como gatillo.
   *
   * Hace falta distinguirlos: un gatillo analógico también es un eje y
   * descansa en -1, que en la codificación del hat significa ARRIBA. Sin esta
   * comprobación la nave se iría sola contra el techo con el mando quieto.
   *
   * La marca fiable es que un hat centrado se sale del rango (los drivers
   * mandan ~1.29 o ~3.29, nunca un gatillo). Solo cuando hemos visto ese
   * valor damos por bueno el eje.
   */
  private hats = new Set<number>();

  private leerHat(pad: Gamepad): { up: boolean; down: boolean; left: boolean; right: boolean } {
    const vacio = { up: false, down: false, left: false, right: false };
    for (let i = 4; i < pad.axes.length; i++) {
      const v = pad.axes[i];
      if (v === undefined) continue;
      if (v > 1.05) { this.hats.add(i); continue; }
      if (!this.hats.has(i)) continue;
      if (Math.abs(v) < 0.05) continue;
      // -1 = arriba, y avanza en 8 pasos de 2/7 girando en sentido horario.
      const paso = Math.round((v + 1) * 3.5);
      if (paso < 0 || paso > 7) continue;
      return {
        up: paso === 0 || paso === 1 || paso === 7,
        right: paso === 1 || paso === 2 || paso === 3,
        down: paso === 3 || paso === 4 || paso === 5,
        left: paso === 5 || paso === 6 || paso === 7,
      };
    }
    return vacio;
  }
}
