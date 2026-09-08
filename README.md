# Star Viper 2000

Shoot-'em-up horizontal de arcade para navegador. Inspirado en los shooters
espaciales clásicos y en los juegos móviles de principios de los 2000, pero con
identidad visual, assets y diseño de juego propios.

Estado: **Fase 0 — arquitectura definida, sin código todavía.**

---

## Stack

| Capa | Herramienta |
|---|---|
| Lenguaje | TypeScript |
| Build / dev server | Vite |
| Render | HTML5 Canvas 2D |
| Audio | Web Audio API (sonidos sintetizados, sin ficheros) |
| Input móvil | Pointer Events |
| Motor de juego | Ninguno — todo a mano |
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

---

## Controles

### Teclado (desarrollo / escritorio)

| Tecla | Acción |
|---|---|
| Flechas / WASD | Mover |
| Espacio | FIRE (disparo primario) |
| M | MISSILE |
| Shift | PWR (activar la mejora seleccionada) |
| Enter | Start / Restart |
| P | Pausa |

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

---

## Multijugador (futuro, NO en la fase 1)

El objetivo a largo plazo es **cooperativo online para 2 jugadores desde dos
teléfonos distintos**, con servidor autoritativo. La fase 1 no implementa red,
pero la arquitectura ya separa estado / input / render para que se pueda añadir
sin reescribir el juego. Ver `docs/LOGIC.md` § Preparación para multijugador.
