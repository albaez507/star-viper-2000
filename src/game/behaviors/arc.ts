import type { Enemy } from '../enemy';

const SPEED = 250;
// Giro lento a propósito. Con 0.9 el arco se enderezaba enseguida y cada
// mitad se quedaba en su lado de la pantalla, así que no se cruzaba nada --
// que era justo el objetivo. Con 0.55 el que entra por arriba termina en la
// mitad de abajo y viceversa, y las dos corrientes se atraviesan.
const TURN = 0.55;

/**
 * Entrada en arco desde arriba o desde abajo.
 *
 * Existe por una razón concreta: hasta ahora **las seis oleadas del juego
 * entraban por el mismo sitio**, el borde derecho, en fila y a media altura.
 * Por eso nada se sentía coreografiado. Lo que en Gradius se lee como
 * inteligencia no es que cada enemigo sea listo, sino que las trayectorias se
 * CRUCEN, y para cruzarse tienen que venir de sitios distintos.
 *
 * Entra en diagonal hacia dentro, curva, y **se endereza**. Ese tope es lo
 * importante: sin él sigue girando, describe un rizo y se sale por donde
 * entró — medido, avanzaba 5 px en segundo y medio. Con el tope describe una
 * curva de entrada y se va recto hacia la izquierda, que es lo que se lee
 * como una maniobra.
 *
 * Campos: `divingVx` es el rumbo actual en radianes, `divingVy` el sentido
 * del giro (+1 los que entran por arriba, -1 los de abajo).
 */
export function arc(e: Enemy, dt: number): void {
  e.t += dt;

  e.divingVx += TURN * e.divingVy * dt;
  // π = recto hacia la izquierda. Es donde termina la maniobra.
  e.divingVx = e.divingVy > 0
    ? Math.min(e.divingVx, Math.PI)
    : Math.max(e.divingVx, -Math.PI);

  e.x += Math.cos(e.divingVx) * SPEED * dt;
  e.y += Math.sin(e.divingVx) * SPEED * dt;
}
