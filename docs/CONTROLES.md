# Dash, carga, misil y cambio de arma — análisis

Escrito el 2026-09-10, a partir de las cinco ideas que salieron jugando con el
mando: dash, detonación en otro botón, cambio de arma, disparo cargado estilo
Mega Man, y un misil que se use menos pero pegue mucho más.

Nada de esto está implementado todavía. Este documento es para decidir.

---

## 0. Lo que ya hay, en números

Para que las propuestas no sean al aire:

| Cosa | Valor hoy | Dónde |
|---|---|---|
| Velocidad de la nave | 220 px/s | `player.ts` |
| Cadencia de disparo | 0.14 s | `player.ts` |
| Misil | cada **1.4 s**, radio 46 px | `player.ts`, `world.ts` |
| Invulnerabilidad tras recibir daño | 1.5 s | `player.ts` |
| Pantalla | 960 × 540 | `main.ts` |

El dato que importa: **el misil sale cada 1.4 segundos**. Eso no es un
recurso, es un segundo botón de disparo. Por eso se siente a spam.

---

## 1. Dash

### La decisión que de verdad importa: ¿te hace invulnerable?

Todo lo demás del dash es cosmético al lado de esto.

Si el dash da invulnerabilidad, **la respuesta a todo el juego pasa a ser
"dashear"**. Los obstáculos que acabamos de meter dejan de ser obstáculos, los
patrones del jefe dejan de importar, y el juego se convierte en esperar el
enfriamiento. Es el error clásico al añadir un dash a un shmup.

**Recomendación: el dash da velocidad, no inmunidad.** Te saca de la
trayectoria de una bala; no te deja atravesar una roca. Sigue siendo
exactamente lo que pediste — evadir algo que viene muy rápido — pero te obliga
a dashear *hacia un hueco*, que es donde está la habilidad.

### Números propuestos

| Parámetro | Valor | Por qué |
|---|---|---|
| Velocidad | 3.5× (770 px/s) | Se lee como otra cosa, no como "ir rápido" |
| Duración | 0.16 s | Recorre ~120 px: cuatro veces tu nave. Un hueco, no media pantalla |
| Enfriamiento | 0.7 s | Es una herramienta, no una forma de moverse |
| Disparo durante el dash | **bloqueado** | El precio. Sin precio no es una decisión |

### La dirección

Tal como lo describiste, y además es lo estándar: el dash va **en la dirección
que estés pulsando en ese momento**. Si no pulsas ninguna, va hacia delante.
No hace falta ninguna secuencia tipo Street Fighter — mantienes la dirección y
pulsas el botón.

### La estela azul

El sistema de partículas ya tiene `thruster` (cono estrecho hacia atrás) y
`burst`. La estela es un tercer emisor que deja copias de la silueta
desvaneciéndose. Barato.

**Coste total: bajo.** Es un estado con temporizador en el jugador y un
multiplicador en `movePlayer`. No toca colisiones ni el mundo.

---

## 2. Misil: menos, más fuerte, que rastree

Esto es lo que más va a cambiar cómo se siente el juego, y coincido con la
idea entera.

### El cambio de fondo: munición, no enfriamiento

Un enfriamiento te hace **esperar**. Munición te hace **decidir**. Es la
diferencia entre "todavía no" y "¿lo gasto ahora o lo guardo para el jefe?".

| | Hoy | Propuesta |
|---|---|---|
| Disponibilidad | cada 1.4 s, infinitos | **3 misiles**, máximo 5 |
| Recarga | automática | 1 cada ~20 s, y sueltan las acosadoras |
| Daño | igual que una bala | **×6** |
| Radio | 46 px | 70 px |
| Trayectoria | recto | **rastrea** al más cercano, y al jefe si está activo |

El rastreo ya existe: `guiarBala` con `HOMING_TURN = 3.6`, que usa LANCE. Se
reutiliza tal cual.

Con esto el misil pasa a ser lo que querías: la herramienta del jefe. Llegas
con 3 o 4 guardados y decides cuándo soltarlos.

⚠️ **Un aviso:** con rastreo + ×6 de daño + área, el misil puede volverse
también la respuesta a las formaciones, y eso rompe el Power Core (que exige
matar la formación entera sin escapes). Si pasa, la palanca no es bajarle el
daño: es que **el misil no derribe a un miembro de formación de un solo
impacto**, para que siga habiendo que limpiarlas con el arma.

### Detonar en su propio botón — sí

Y no solo por comodidad: hoy el mismo botón lanza y detona, así que un doble
toque nervioso te detona el misil en la cara. Separarlos arregla un fallo real
además de darte control del momento.

---

## 3. Disparo cargado (estilo Mega Man)

Me pediste definir cuándo y cómo. La regla que hace que funcione en Mega Man
no es el daño: es que **cargar te cuesta dejar de disparar**. Si puedes cargar
mientras disparas, cargar es gratis, y entonces es siempre mejor y el juego se
reduce a mantener el botón.

### La regla

1. Mantienes FUEGO. Los primeros 0.35 s disparas normal.
2. A partir de ahí **el disparo normal se corta** y empieza a cargar. La nave
   brilla y sube un sonido.
3. A los 0.9 s está listo: un destello lo avisa.
4. Al soltar, sale el disparo cargado. Si sueltas antes, no sale nada — has
   perdido ese tiempo de disparo.

Así el toque repetido sigue funcionando igual que ahora, y cargar es una
apuesta: renuncias a tu DPS durante un segundo a cambio de un golpe grande.
**No necesita enfriamiento**: el tiempo de carga ya lo es, y se equilibra solo.

### El disparo

Atraviesa (no se apaga en el primer enemigo) y pega como ~8 balas. Contra una
formación en línea es devastador; contra enemigos sueltos y rápidos es un
desperdicio. Esa asimetría es la que da la decisión.

**Sin feedback esto no existe.** Brillo creciente en la nave, sonido que sube,
destello al estar listo. Es la misma lección del misil: una mecánica que no se
ve se siente rota aunque funcione.

---

## 4. Cambio de arma — el único con un problema de fondo

Aquí hay que parar. **Hoy no hay entre qué cambiar.**

Cada nave tiene *un* arma que sube de nivel 0→3 con los cores. No existen dos
armas entre las que alternar, así que un botón de cambio no tendría qué hacer.
Y montar un segundo arma completa choca de frente con la decisión que ya
tomaste: *todos empiezan básicos y el primer item activa el arma de tu nave*.

### Lo que sí encaja: dos modos de la misma arma

En vez de dos armas, **dos formas de disparar la tuya**. Se conserva toda la
progresión de cores y aparece la versatilidad que buscabas.

| Nave | Modo ABIERTO | Modo CONCENTRADO |
|---|---|---|
| **VULCAN** | Abanico ancho, poco daño por bala. Para enjambres y formaciones | Todas las balas en línea. Para el jefe y la nave rival |
| **LANCE** | Rastreador: gira solo, daño bajo. Para lo que se mueve mucho | Lanza perforante recta, daño alto. Para lo que aguanta |

Eso es exactamente lo que describiste: *"hay enemigos que no me funcionen con
el lance normal, sino que me funcione de otra manera"*. Y cuesta poco — la
función que arma el disparo ya recibe el nivel; solo hay que pasarle también
el modo.

---

## 5. Los botones

Con FUEGO mantenido casi todo el rato, lo que se pulse bajo presión tiene que
poder pulsarse **sin soltar el pulgar del disparo**. Por eso el dash va a un
gatillo, no a un botón de cara.

| Botón | Función | Por qué ahí |
|---|---|---|
| **A** (cara) | FUEGO · mantener = cargar | Es donde vive el pulgar |
| **B** (cara) | Lanzar misil | Al lado, se alterna rápido |
| **L** (gatillo) | **DASH** | Se pulsa en emergencia sin soltar el disparo |
| **R** (gatillo) | **DETONAR** el misil | El otro índice, y nunca se confunde con lanzarlo |
| **Select** o botón libre | Cambiar modo de arma | Se usa entre oleadas, no bajo presión |
| **Start** | Pausa | Ya funciona |

Te propongo el dash en **L** y no en **R** aunque dijiste que no sabías cuál:
el dash es lo que más vas a pulsar en pánico, y el índice izquierdo está libre
mientras el derecho no hace nada crítico.

⚠️ **En el teléfono no caben.** Hoy el táctil solo tiene FIRE y MSL. Dash y
detonación necesitan sitio: lo más natural es **deslizar en el D-pad** para el
dash (gesto, no botón) y un tercer botón pequeño para detonar. Eso hay que
diseñarlo aparte; el mando no puede ser la única forma de jugar completo.

---

## 6. En qué orden

Ordenado por cuánto cambia el juego dividido por lo que cuesta:

1. **Dash.** El que más cambia cómo se siente, y no depende de nada.
2. **Misil con munición + rastreo + más daño.** Cambia el ritmo de la partida
   entera y arregla el spam.
3. **Detonar en su botón.** Media hora, y arregla el doble toque accidental.
4. **Disparo cargado.** Depende de que el feedback esté bien hecho.
5. **Modos de arma.** El último: es el que toca el diseño de las armas, y
   conviene decidirlo con el tope de arma por sector (`OBSTACULOS.md` §4) ya
   resuelto, porque los dos tocan lo mismo.
