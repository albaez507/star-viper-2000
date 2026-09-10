import type { Enemy } from '../enemy';

const ENTRY_SPEED = 210;
const PAUSE = 0.35;
const SLIDE_SPEED = 130;
const EXIT_SPEED = 180;

/**
 * Fila que entra, **frena** y se desliza a tu altura.
 *
 * Es el patrón que hace que un escuadrón parezca que piensa, y no piensa: lo
 * que lo consigue es el **frenazo**. Todo lo demás del juego entra y cruza a
 * velocidad constante, así que un grupo que se detiene rompe el ritmo y el
 * ojo lo lee como una decisión. Después se alinea contigo en vertical, que es
 * lo que remata la impresión de que te están buscando.
 *
 * La clave para que no sea injusto: se alinea **una sola vez**, al llegar a
 * su puesto, y luego ya no te sigue. Si te mueves después de que se hayan
 * colocado, has ganado — y esa es exactamente la respuesta que se quiere
 * enseñar.
 *
 * Campos que usa:
 * - `anchorX`  dónde frena.
 * - `divingVy` su hueco dentro de la fila, para que el grupo conserve la
 *   forma al centrarse sobre el jugador en vez de amontonarse en un punto.
 * - `anchorY`  la altura congelada. -1 significa "todavía no he llegado".
 */
export function column(e: Enemy, dt: number, playerY: number): void {
  e.t += dt;

  // 1) Entrada hasta su puesto.
  if (e.anchorY < 0) {
    e.x -= ENTRY_SPEED * dt;
    if (e.x <= e.anchorX) {
      e.x = e.anchorX;
      e.anchorY = playerY + e.divingVy;
      e.diveDelay = e.t + PAUSE;
    }
    return;
  }

  // 2) El frenazo. Ese hueco quieto es lo que se lee como intención.
  if (e.t < e.diveDelay) return;

  // 3) Deslizamiento vertical hasta la altura congelada.
  const dy = e.anchorY - e.y;
  if (Math.abs(dy) > 2) {
    e.y += Math.sign(dy) * Math.min(Math.abs(dy), SLIDE_SPEED * dt);
    return;
  }

  // 4) Colocada: se marcha por la izquierda, ya disparando.
  e.x -= EXIT_SPEED * dt;
}
