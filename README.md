# Star Viper 2000

Shoot-'em-up horizontal de arcade para navegador. Inspirado en los shooters
espaciales clásicos y en Contra Force (acabado de sprite NES), con identidad
propia: no es un clon.

Hay dos sectores jugables: **Órbita Sentinel** (espacio) y **Jardines del
Céfiro** (cielo). El cielo es un borrador de arte. El jugador aún no ha
decidido si se queda, se redibuja al brief, o se tira.

---

## Repositorio activo

**Este es el único repo. No hay otro.**

| | |
|---|---|
| Activo | https://github.com/albaez507/star-viper-2000 |
| Carpeta local | `C:\Users\witha\Documents\DEVELOPMENT EMANUEL\star-viper-2000` |
| Remoto `origin` | `albaez507/star-viper-2000` · rama `main` |
| Privado | sí |

`albaez507/Star-Viper` fue una copia vacía del mismo día. **Se eliminó a
propósito.** Si un agente ve ese nombre en un chat viejo, ignorarlo. No
crear otro repo. No empujar a otro sitio.

Cualquier cambio se commitea y se pushea a **este** `origin/main`.

---

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:5175
npm run test     # simulación de sectores, armas y cores
npm run build    # genera dist/
npm run preview  # sirve dist/
```

La barra DEV y el laboratorio visual están escondidos. Se abren con
**Herramientas de vuelo +** abajo a la derecha.

| Botón | Qué hace |
|---|---|
| ▶ Jugar | Partida normal desde el principio |
| 👹 Ir al jefe | Salta a la secuencia de llegada (警告) |
| 🐝 Enjambre | Salta a la oleada de enjambre |
| 🔫 Probar armas | Enemigo de práctica; cada click sube el arma / cambia de nave |

---

## Controles

| Tecla | Acción |
|---|---|
| Flechas / WASD | Mover |
| Espacio | FIRE |
| M, X o Ctrl (izq.) | MISSILE (bomba de área; segundo toque detona en el aire) |
| Enter | Start / Restart |
| P | Pausa |

Táctil: D-pad a la izquierda, FIRE encima de MISSILE a la derecha.
Pensado primero para iPhone.

---

## Cómo funciona ahora

Ya **no** hay medidor Gradius ni botón PWR. Cada nave tiene su arma:

1. Empiezas con el disparo básico.
2. Si destruyes una **formación de 6** entera (nadie escapa), cae un
   **Power Core**.
3. El primer core **activa el arma de tu nave**. Los siguientes la suben
   de nivel (máximo 3).
4. Un golpe te baja **un nivel de arma** (y una vida, si no hay escudo).

| Nave | Arma | Trade-off |
|---|---|---|
| **VULCAN** | Ráfaga | 3 vidas. Más balas, daño 1 |
| **LANCE** | Buscador | 2 vidas. Persigue, dispara poco |

FORGE y MINE están en `docs/ARMAS.md` y **aún no existen**.

La acosadora suelta un **item de hangar** (progreso entre partidas). El
enjambre no suelta core. Detalle en `docs/LOGIC.md` y `docs/HANGAR.md`.

---

## To-do

Lista viva. Un agente que cierre un punto lo marca `[x]` y lo anota en
`docs/BITACORA.md`. No inventar un segundo tablero.

### Decidir (el jugador, no el agente)

- [ ] **Arte del cielo.** ¿Se queda Jardines del Céfiro, se redibuja al
      brief NES de `docs/ASSET_BRIEF.md`, o se tira y solo queda Órbita
      Sentinel? No generar más packs de arte hasta que esto esté decidido.
- [ ] ¿El jefe del cielo (el pez/guardián) se acepta o se vuelve a
      Sentinel, fortaleza blocky?

### Arte (cuando haya decisión)

- [ ] Nave por **capas alineadas** (casco / alas / motor / cañón). Hoy
      solo se dibuja el casco: las otras tres piezas no coinciden.
- [ ] Enemigos dañados que faltan, a tamaño real del brief.
- [ ] Fondos que repitan sin costura (960×540, 3 capas). El cielo actual
      es una sola imagen.
- [ ] Capa cercana de verdad, no un recorte del mismo fondo.

### Juego

- [ ] Naves **FORGE** y **MINE** (`docs/ARMAS.md`).
- [ ] Probar balance otra vez después de jugar una run completa (cores
      fáciles de coger, arma que no borra la pantalla).
- [ ] Entrada de enemigos por arriba / abajo (pausado a propósito).
- [ ] Obstáculos y colisión contra terreno (hace falta motor nuevo).

### Publicar / probar

- [ ] Esconder DEV + visual lab en la build que ve un jugador.
- [ ] Probar en un **iPhone real**: táctil, audio, portrait.
- [ ] Conectar **Cloudflare Pages** a este repo (`npm run build` → `dist/`).
- [ ] Revisar volumen del audio sintetizado en dispositivo real.

### Más adelante (no ahora)

- [ ] Viaje continuo tierra → nubes → espacio → otro planeta.
- [ ] Entornos cueva / océano / volcán / hielo.
- [ ] Piezas de hangar que se vean puestas en la nave.
- [ ] Multijugador cooperativo. El hangar en `localStorage` **no sirve**
      para eso (`docs/HANGAR.md`).

---

## Stack

TypeScript + Vite + Canvas 2D. Audio sintetizado (Web Audio). Sin motor
de juego, sin dependencias de runtime. Deploy previsto: Cloudflare Pages.

---

## Documentación

| Fichero | Para qué |
|---|---|
| `docs/STRUCTURE.md` | Carpetas y reglas de importación |
| `docs/LOGIC.md` | Arquitectura y sistemas |
| `docs/BITACORA.md` | Qué se hizo y por qué, en orden |
| `docs/ARMAS.md` | Diseño de armas (FORGE/MINE aún no) |
| `docs/HANGAR.md` | Items persistentes |
| `docs/ASSET_BRIEF.md` | Brief de arte: Contra Force NES, paleta, tamaños |

El código de simulación vive en `src/game/` y **no** toca DOM, Canvas ni
`Math.random()`. El arte y el menú viven en `src/render/` y `src/main.ts`.
