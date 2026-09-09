# Sistema de armas — propuesta

> Estado: **propuesta, sin implementar.** Sustituye al medidor de poder actual.

## El problema que resuelve

El medidor de poder estilo Gradius que hay hoy (SPEED · MISSILE · DOUBLE ·
LASER · OPTION · SHIELD con cursor y botón PWR) tiene un fallo de comunicación
que se manifestó tres veces jugando: **para llegar a un arma hay que juntar 3
cores sin gastar ninguno**. Como el instinto natural es gastar el primer core
en cuanto aparece, siempre cae en SPEED — la primera casilla — y el arma no
cambia nunca.

Irónicamente, Contra Force (la referencia que gusta) usa **ese mismo medidor**.
Lo que se recuerda con cariño de ese juego no es el medidor: es que **cada
personaje tenía su propia arma característica**, y que las armas estaban
escondidas dentro de cosas que destruías.

## La propuesta

### 1. Todo el mundo empieza igual

Arma básica, sin adornos. Es el punto de partida común: cadencia media, daño
1, un disparo recto. Lo que ya existe hoy como `single`.

### 2. El primer item activa **tu** arma

En cuanto recoges el primer premio, **se activa el arma característica de tu
nave**. No eliges de un menú: es la que tu nave lleva de fábrica. Eso convierte
el primer premio en un momento — "ahora sí estoy jugando con mi nave".

### 3. Los premios siguientes la suben de nivel

Cada premio adicional sube el arma característica un nivel (más cadencia, más
proyectiles, más daño), hasta un máximo de 3. Sin cursor, sin decidir, sin
botón PWR: recoges y sube.

---

## Las cuatro naves y sus armas

Traducción directa del reparto de Contra Force, adaptada a un shmup espacial.
Cada nave tiene un **trade-off real**: no hay una que sea mejor.

| Nave | Arma característica | Cómo se comporta | Trade-off |
|---|---|---|---|
| **VULCAN** (≈ Burns) | Ráfaga rápida | Cadencia muy alta, daño bajo por disparo | Equilibrada, la nave "por defecto" |
| **LANCE** (≈ Smith) | Proyectil buscador | Menos disparos, pero **persiguen al enemigo más cercano** | Cadencia baja: si fallas, esperas |
| **FORGE** (≈ Iron) | Cono corto | Abanico amplio de corto alcance, daño alto | **Alcance corto**: hay que acercarse, que es donde te matan |
| **MINE** (≈ Beans) | Minas | Suelta minas que estallan en área al contacto o a los N segundos | No dispara hacia delante: hay que anticipar |

**Además, cada nave se mueve distinto** — igual que en Contra Force, donde los
personajes cambiaban en velocidad y salto:

| Nave | Velocidad | Vidas |
|---|---|---|
| VULCAN | Normal | Normal |
| LANCE | Rápida | Menos resistente |
| FORGE | Lenta | Más resistente |
| MINE | Rápida | Normal |

> Para la primera versión basta con implementar **VULCAN** y una segunda nave
> (sugerencia: LANCE, porque el proyectil buscador es el contraste más
> evidente). Las otras dos después.

---

## Qué pasa con los premios que no son armas

Al quitar el medidor hay que recolocar SPEED, MISSILE, OPTION y SHIELD. La
propuesta es repartir los premios por **fuente**, de modo que cada una
signifique algo distinto:

| Fuente | Premio | Escala |
|---|---|---|
| **Formación de 6 completa** | Sube el arma característica un nivel (o la activa, si es el primero) | Esta partida |
| **Nave acosadora** | Item de hangar | Permanente |
| **Contenedor destruible** *(futuro)* | Mejora de apoyo con etiqueta visible: escudo, Option, velocidad | Esta partida |

Los contenedores destruibles son la parte de Contra Force que vale la pena
robar: el premio sale de **algo que rompiste**, no de un contador. Hasta que
existan, las mejoras de apoyo pueden salir de las mismas formaciones de forma
alterna (una sí, una no).

---

## Lo que se pierde, dicho claro

El medidor tenía una tensión real: aguantar cinco formaciones perfectas sin
gastar para llegar a SHIELD. Eso desaparece. A cambio se gana que **el arma
cambie de verdad y se note**, que era el problema que bloqueaba el juego.

El usuario ya dijo que le da igual no llegar a SHIELD, así que el cambio está
aprobado — pero queda escrito para que no se olvide qué se cambió por qué.

---

## Impacto en assets

Esto **sí** añade trabajo de arte, y conviene decidirlo antes de pedirlo:

- Cada arma característica necesita su propio proyectil (4 sprites).
- Si las naves son visualmente distintas, 4 cascos en vez de 1.
- Los niveles de arma deberían notarse (más proyectiles en pantalla ya lo
  comunica; no hace falta arte extra por nivel).

Mientras se decide, el juego puede usar las 4 armas con el sprite de bala
actual recoloreado.
