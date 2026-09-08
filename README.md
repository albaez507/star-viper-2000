# Star Viper 2000

Shoot-'em-up horizontal de arcade para navegador. Inspirado en los shooters
espaciales clásicos y en los juegos móviles de principios de los 2000, pero con
identidad visual, assets y diseño de juego propios.

Estado: **Milestone 1 — prototipo jugable con placeholders geométricos.**

---

## Stack

| Capa | Herramienta |
|---|---|
| Lenguaje | TypeScript |
| Build / dev server | Vite |
| Render | HTML5 Canvas 2D |
| Audio | Web Audio API (sonidos sintetizados, sin ficheros) |
| Input móvil | Pointer Events |
| Motor de juego | Ninguno — motor 2D propio sobre Canvas |
| Deploy | Cloudflare Pages (ver `docs/LOGIC.md` § Deploy) |

Sin motor de juego en la v1. Sin dependencias de runtime.

---

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/ para probar la build
```

Arriba del canvas hay una **barra de desarrollo** (solo en local, no se saca
antes de publicar) para no tener que jugar el stage completo cada vez que se
quiere probar algo:

| Botón | Qué hace |
|---|---|
| ▶ Jugar | Empieza la partida normal desde el principio |
| 👹 Ir al jefe | Salta directo a la secuencia de llegada del jefe (警告 y todo) |
| 🔫 Probar armas | Pone un enemigo de práctica con mucha vida quieto en pantalla; cada click cicla SINGLE → DOUBLE → LASER para comparar daño/cadencia/patrón sin tener que ganar mejoras primero |

El arma equipada también se ve siempre en el HUD ("ARMA: ...") junto a LIVES.

---

## Controles

### Teclado (desarrollo / escritorio)

| Tecla | Acción |
|---|---|
| Flechas / WASD | Mover |
| Espacio | FIRE (disparo primario) |
| M, X o Ctrl (izq.) | MISSILE |
| Shift | PWR (activar la mejora seleccionada) |
| Enter | Start / Restart |
| P | Pausa / continuar |

Hay además un botón de pausa (⏸) fijo en la esquina superior derecha de la
pantalla, visible siempre durante la partida — no depende del teclado.

**MISSILE es una bomba, no un arma secundaria de disparo continuo**: hace daño
en área (explota al impactar y daña a todo lo que esté cerca del punto de
explosión, no solo a un enemigo) y tiene un cooldown de ~1.4s (baja con la
mejora MSL del medidor de poder). Se ve una barra "MISIL" bajo LIVES en el HUD
que se llena mientras recarga y se pone naranja brillante — con el texto
"MISIL LISTO" — en cuanto se puede volver a usar. El botón táctil MSL también
brilla cuando está listo.

**Detonación manual**: si ya hay un misil en vuelo y se vuelve a pulsar
MISSILE, el misil en camino explota ahí mismo en vez de esperar a chocar con
algo — así se puede elegir el punto exacto de la explosión en vez de depender
de que un enemigo se cruce en la trayectoria.

### Táctil (iPhone / móvil)

```
IZQUIERDA                        DERECHA

       UP
                                     FIRE
LEFT  (PWR)  RIGHT
                                    MISSILE
      DOWN
```

- **PWR** es el botón circular central del D-pad. Se pulsa con el pulgar
  izquierdo sin soltar la cruceta.
- **FIRE** y **MISSILE** van apilados en vertical, no lado a lado.
- Multi-touch real: mover y disparar a la vez es obligatorio.
- Diseñado primero para pantalla tipo iPhone (390×844), en horizontal y en
  vertical.

---

## Cómo funciona el medidor de poder

Barra de 6 casillas, en orden fijo:

```
SPEED · MISSILE · DOUBLE · LASER · OPTION · SHIELD
```

1. Los enemigos llegan a veces en **formaciones de seis**, marcadas visualmente.
2. Si el jugador destruye la formación **entera antes de que ninguno escape**,
   suelta un **Power Core**.
3. Si **uno solo escapa**, no hay core. Nada de "cores cada X kills".
4. Recoger un core **avanza el cursor** una casilla en el medidor.
5. Pulsar **PWR** activa la mejora donde esté el cursor y **reinicia el cursor**
   a la primera casilla.

Es decir: el jugador decide entre gastar pronto (SPEED barato) o aguantar
formaciones seguidas para llegar a OPTION o SHIELD.

**DOUBLE y LASER se ven y se sienten distintos, no solo cambian el número de
daño:**

| Arma | Disparo | Daño | Cadencia | Especial |
|---|---|---|---|---|
| SINGLE (inicial) | Un disparo dorado | 1 | Rápida | — |
| DOUBLE | Dos disparos dorados en paralelo | 1 cada uno (2 en total por ráfaga) | Igual que SINGLE | El doble de balas en pantalla |
| LASER | Un rayo alargado color teal | **2** por impacto | Algo más lenta | **Atraviesa enemigos** — un solo disparo puede dañar a varios en línea |

DOUBLE y LASER se excluyen entre sí (activar uno reemplaza al otro).

Detalle de cada mejora y del sistema de Options en `docs/LOGIC.md`.

---

## Cómo funcionan los patrones de enemigos

Cada enemigo tiene un **comportamiento** intercambiable: una función que recibe
el enemigo, el delta-time y el estado del mundo, y actualiza su posición. El
enemigo no sabe cómo se mueve; el comportamiento sí.

Patrones de la fase 1:

| Patrón | Movimiento |
|---|---|
| `scout` | Recto en horizontal, velocidad constante |
| `sine` | Horizontal + oscilación senoidal vertical |
| `diver` | Entra recto, luego se lanza hacia la posición del jugador |
| `formation` | Miembro de un grupo de 6 ligado a un Power Core |

Añadir un patrón nuevo = añadir una función al registro de comportamientos y
referenciarla por nombre desde los datos de la oleada. No se toca ninguna otra
parte del motor.

---

## Documentación

| Fichero | Contenido |
|---|---|
| `docs/STRUCTURE.md` | Estructura de carpetas y qué hace cada módulo |
| `docs/LOGIC.md` | Arquitectura, bucle de juego, sistemas, plan de multijugador |
| `docs/BITACORA.md` | Registro cronológico de decisiones y avances |
| `docs/ASSET_BRIEF.md` | Brief de sprites para pasar a otro modelo: tamaños, paleta, orientación |

---

## Multijugador (futuro, NO en la fase 1)

El objetivo a largo plazo es **cooperativo online para 2 jugadores desde dos
teléfonos distintos**, con servidor autoritativo. La fase 1 no implementa red,
pero la arquitectura ya separa estado / input / render para que se pueda añadir
sin reescribir el juego. Ver `docs/LOGIC.md` § Preparación para multijugador.
