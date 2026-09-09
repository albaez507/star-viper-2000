# Panel de nave y piezas — análisis

> Estado: **análisis, sin implementar.** El hangar de hoy (`docs/HANGAR.md`)
> es una lista de texto con tres mejoras. Esto es la propuesta para
> convertirlo en lo que el usuario pidió: una pantalla donde ves tu nave
> grande, le pones piezas, y las piezas **cambian cómo juegas**.

---

## La idea en una frase

Tu nave no es un sprite fijo: es **cuatro ranuras**. Lo que metes en cada una
se ve puesto en la nave y cambia sus números.

---

## Las cuatro ranuras

Son las mismas cuatro capas que el `ASSET_BRIEF.md` ya pide al artista, y no
por casualidad: se pidieron así justamente para que esto fuera posible sin
redibujar la nave entera por cada pieza.

| Ranura | Qué cambia sobre todo |
|---|---|
| **Casco** | Cuánto aguantas |
| **Alas** | Cómo te mueves y qué tan grande es tu blanco |
| **Motor** | Velocidad y recarga del misil |
| **Cañón** | Daño y cadencia |

---

## La regla que hace que esto sea un sistema y no una tienda

**Ninguna pieza es mejor que otra: cada una cobra algo.**

Si el cañón pesado solo diera más daño, todo el mundo llevaría el cañón
pesado y la pantalla sobraría. Al cobrar cadencia, elegir cañón se convierte
en decidir cómo quieres jugar.

| Ranura | Pieza | Da | Cobra |
|---|---|---|---|
| Casco | Blindado | +1 vida | −10% velocidad |
| Casco | Ligero | +15% velocidad | −1 vida |
| Alas | Anchas | Giro más rápido | Blanco más grande |
| Alas | Recortadas | Blanco más pequeño | Giro más lento |
| Motor | Sobrealimentado | +velocidad | Misil recarga más lento |
| Motor | Reciclador | Misil recarga rápido | −velocidad |
| Cañón | Pesado | +daño por disparo | −cadencia |
| Cañón | Rápido | +cadencia | −daño por disparo |

La pieza **de serie** de cada ranura no cobra nada y no da nada: es el punto
neutro con el que se comparan las demás.

---

## Cómo se relaciona con los Power Cores

Son dos progresiones distintas y conviene que no se pisen:

| | Qué decide | Cuándo | Se pierde al morir |
|---|---|---|---|
| **Piezas (hangar)** | **Cómo** juegas — tu estilo | Entre partidas | No |
| **Cores (en partida)** | **Cuánta** potencia tienes ahora | Durante la run | Sí |

Regla para no romper el juego: **las piezas no deben dar potencia bruta.** Si
el hangar te sube el daño sin límite, la run deja de tener curva y vuelve el
problema de "gano demasiado fácil". Las piezas mueven la aguja de un lado a
otro; los cores son los que suben.

---

## Qué hace falta antes de poder construirlo

**Bloqueado por arte, no por código.** Hoy el juego dibuja solo
`ship-hull.png` porque las otras tres capas llegaron dibujadas como objetos
sueltos a lienzo completo, no como partes alineadas sobre una misma nave. Si
se apilan, sale un amasijo (por eso están desactivadas).

Para que el panel muestre las piezas puestas hace falta:

1. Las cuatro capas base **alineadas entre sí** (ya está en el to-do).
2. Una variante por pieza de la tabla de arriba — 8 archivos más, misma
   silueta base, aspecto más pesado / más afilado / más ligero.

Mientras eso no exista, el panel puede construirse igual y enseñar la nave
grande con el casco actual: se ve bonita y las piezas funcionan a nivel de
números. Lo que no se puede todavía es **verlas puestas**, que es justo la
parte que más ilusión hace.

---

## Recomendación de orden

1. **Ahora:** dejar esto escrito y no construir todavía. El sistema de
   power-ups está en rediseño y el arte de capas no está listo; construir el
   panel ahora es garantizar rehacerlo.
2. **Cuando lleguen las capas alineadas:** construir el panel con la nave
   grande y las cuatro ranuras, aunque solo haya la pieza de serie.
3. **Después:** añadir las variantes, que a esas alturas es solo rellenar una
   tabla.
