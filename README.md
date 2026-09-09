# Star Viper 2000

Shoot-'em-up horizontal de arcade para navegador. Pixel art detallado, luz
cálida, fondos con profundidad. La idea a largo plazo es que los niveles sean
un **viaje**: tierra → nubes → altura → espacio → otro planeta.

Hay dos sectores jugables: **Órbita Sentinel** (espacio) y **Jardines del
Céfiro** (cielo). **El estilo del cielo es el elegido** (2026-09-09) y manda
sobre lo que decía antes el brief. Órbita no se tira: el espacio es un tramo
posterior del mismo viaje.

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
3. El primer core **activa el arma de tu nave**. A partir de ahí cada nivel
   cuesta **dos cores** (umbrales 1, 3, 5), así que llegar al máximo exige
   las cinco formaciones perfectas de un sector.
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

- [x] **Arte del cielo.** Decidido: se queda. El brief se reescribió al
      estilo detallado (`docs/ASSET_BRIEF.md` §0).
- [ ] ¿El jefe del cielo (el pez/guardián) se acepta o se vuelve a
      Sentinel, fortaleza blocky?

### Arte (cuando haya decisión)

- [ ] **ENCARGO ACTIVO:** nave por **capas alineadas** (casco / alas /
      motor / cañón). Hoy solo se dibuja el casco. Ver `ASSET_BRIEF.md`
      § ENCARGO ACTUAL. Es lo único pedido ahora mismo.
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
- [ ] Panel de nave con ranuras y piezas (`docs/NAVE_Y_PIEZAS.md`).
      Bloqueado por las capas alineadas, no por código.
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
| `docs/NAVE_Y_PIEZAS.md` | Panel de nave por ranuras y piezas con trade-off (análisis) |
| `docs/ASSET_BRIEF.md` | Brief de arte: estilo detallado, paleta, tamaños, encargo actual |

El código de simulación vive en `src/game/` y **no** toca DOM, Canvas ni
`Math.random()`. El arte y el menú viven en `src/render/` y `src/main.ts`.
