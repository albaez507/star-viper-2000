# Foreground, navegación y el jefe — análisis

Escrito el 2026-09-10, a partir de la maqueta de "Cielos Olvidados" y de tres
observaciones tuyas: que el foreground de esa imagen es solo estético, que
quizá no haga falta limitar el arma sino **hacer más difícil navegar**, y que
el jefe es predecible y no tiene patrones.

Las tres están bien vistas. La segunda y la tercera son, además, el mismo
problema visto desde dos sitios.

---

## 1. Tienes razón: ese foreground no cambia nada

Y quiero llevar la observación un paso más allá, porque no es solo que "no
sirva". Un foreground decorativo colocado sobre la zona de juego **miente**.

En la maqueta, las ruinas con enredaderas ocupan el borde izquierdo, la
esquina inferior izquierda y el borde derecho. Parecen sólidas. Si atraviesas
esas enredaderas sin que pase nada, el jugador aprende una lección que no
quieres que aprenda: **que lo que se ve sólido no lo es**. Y a partir de ahí
duda de todo lo demás, incluidas las rocas que sí matan.

Un adorno que enseña a desconfiar de los gráficos sale caro aunque el arte sea
precioso.

⚠️ Y hay un problema de sitio, no de concepto: **en la maqueta el foreground
más denso está a la izquierda, que es donde vive tu nave.** En un shmup
horizontal el jugador ocupa el tercio izquierdo de la pantalla todo el rato.
Poner ahí la capa que tapa es taparte a ti.

### Las tres opciones, con su precio

| | Qué es | Coste | Qué te da |
|---|---|---|---|
| **A. Decorativo tal cual** | La maqueta | Solo arte | Se ve precioso. Enseña a desconfiar de los gráficos |
| **B. Decorativo honesto** | Igual, pero **solo fuera** del área jugable, como marco | Solo arte | Se ve precioso y no miente. **No cambia la dificultad** |
| **C. Real** | El marco **es** el límite: donde las ruinas se meten, tú no cabes | Medio | Es exactamente lo que pediste |

**Mi recomendación es la C**, y abajo explico por qué ahora sí sale barata
cuando en `OBSTACULOS.md` dije que la dejáramos para más adelante.

---

## 2. Lo que descubrí revisando: ya tienes montado lo que quieres

Dijiste: *"así me pegan más fácil, y yo puedo perder lo que tengo"*.

**Eso ya funciona.** Cuando te dan, `world.ts` te hace retroceder los cores
con `coresParaNivel`, o sea que pierdes nivel de arma. La mecánica de
"perder lo que tienes" está escrita y probada.

Lo que falta no es la penalización. Es la **presión** que la dispare. Hoy hay
tanto sitio libre que casi nunca te tocan.

Por eso tu instinto es correcto y además es la opción barata: **no hace falta
tocar el arma en absoluto**. El tope por sector que propuse en
`OBSTACULOS.md` §4 resolvía el mismo problema quitándote poder; estrechar la
navegación lo resuelve **haciendo que te lo juegues**, que es mucho mejor
porque el que juega bien lo conserva.

Yo aparcaría el tope de arma indefinidamente y me quedaría con esto.

---

## 3. Cómo se hace la opción C sin que sea carísima

En `OBSTACULOS.md` dije que el terreno con paredes era el caro, porque exige
colisión contra una silueta y no contra una caja. Sigue siendo verdad **si se
hace píxel a píxel**. Pero hay un camino intermedio que no vi entonces.

### El perfil de altura

En vez de una silueta, para cada columna de la pantalla guardas **dos
números**: hasta dónde llega el techo y desde dónde empieza el suelo. Un array
de ~60 pares por pantalla. Colisionar contra eso es comparar dos números —
igual de barato que lo que ya haces.

Y lo mejor: ese perfil **se puede sacar solo del propio PNG**, leyendo su canal
alfa una vez al cargar. Así el arte y la colisión no pueden desincronizarse,
que es lo que hace que estas cosas se sientan tramposas.

> Detalle de arquitectura: leer píxeles vive en `src/render/`, y el perfil
> entra a `src/game/` como un array de números normal. La regla de que
> `game/` no toca Canvas se mantiene intacta.

### La regla que evita que se sienta injusto

**La colisión tiene que ser más generosa que el dibujo.** El límite real va
unos 6 px por dentro de donde acaba el arte. Así puedes rozar visualmente una
enredadera y no morir. Al revés — morir por algo que parecía que cabía — es lo
que arruina estos niveles.

### Y no puede ser todo el nivel

Un pasillo estrecho durante 90 segundos agota. Va **por tramos**: se abre, se
cierra, se abre. Y hay dos sitios donde el techo y el suelo tienen que
retirarse del todo: **el enjambre y el jefe**, que necesitan espacio para que
sus patrones signifiquen algo.

### Ya existe media pieza

`world.ts` ya limita tu altura en el sector cielo:
`p.y = Math.max(86, Math.min(worldH - 28, p.y))`. O sea que **ya hay un
pasillo**, solo que fijo y del mismo ancho siempre. Esto es cambiar esos dos
números constantes por dos que varían con el avance. Es menos trabajo del que
parece.

---

## 4. El jefe: no es que sea predecible, es que **no tiene patrones**

Miré `boss.ts` y `stepBoss` enteros. El diagnóstico exacto:

**Movimiento.** Es una suma de tres senos:
```
y = sin(t·1.3)·70 + sin(t·0.47)·40 + cos(t·2.1)·15
```
Eso no es un patrón. Es **ruido suave**: se mueve todo el rato, nunca se
detiene, nunca hace nada distinto. Y aquí está la clave de lo que notaste —
un patrón es algo que se puede **aprender**, y esto no se puede aprender
porque no hay nada que aprender. Es igual en el segundo 3 que en el 40.

**Ataque.** Uno solo: un abanico de balas hacia la izquierda. Entre fases lo
único que cambia es cada cuánto lo lanza (1.1 s → 0.75 s → 0.5 s).

Así que el jefe está a la vez **monótono** (un ataque) y **no aprendible**
(movimiento sin forma). Las dos cosas tienen la misma causa: no hay máquina de
estados. Solo hay un bucle.

### Lo que convierte esto en una pelea

Un jefe se vuelve una conversación cuando cada ataque tiene tres tiempos:

1. **Aviso** (~0.6 s): se coloca, brilla, se hincha. Te dice qué viene.
2. **Ejecución**: el ataque. Difícil, pero **con un hueco**, porque lo
   telegrafió.
3. **Recuperación** (~1 s): se queda quieto y **recibe más daño**.

Ese tercer tiempo es el que hace la pelea. Hoy no existe: el jefe dispara sin
parar, así que atacarle es solo cuestión de aguantar, no de elegir el momento.

### Cuatro ataques que encajan con lo que ya hay

| Ataque | Qué hace | Cómo se esquiva | Reutiliza |
|---|---|---|---|
| **Abanico** | El de hoy, pero en 3 ráfagas con huecos entre ellas | Colarte por el hueco | Ya está escrito |
| **Barrido** | Sube arriba del todo y baja disparando un chorro continuo | Elegir lado y cruzar por detrás | El disparo actual |
| **Embestida** | Avisa, se echa atrás y cruza la pantalla | Esquivar en vertical — **es donde tu dash importa** | El dash ya existe |
| **Muro** | Una pared de balas con un solo hueco que se desplaza | Seguir el hueco | El abanico, con más balas |

**Fase 1:** abanico y barrido. **Fase 2:** entra embestida, la recuperación se
acorta. **Fase 3:** entra muro y encadena dos ataques antes de recuperarse.

Y **la vida está baja**: 30/35/40. Con el misil nuevo pegando 24, un solo
misil se lleva casi una fase entera. Eso hay que subirlo cuando el jefe tenga
ventanas de verdad, porque si no la pelea se acaba antes de que veas los
patrones.

---

## 5. En qué orden, y qué haría yo

1. **La opción B del foreground, ya.** Marco decorativo **fuera** del área
   jugable, en los bordes superior e inferior, nunca sobre el tercio
   izquierdo. Es puro arte, se ve como la maqueta y no miente. Va al
   `ASSET_BRIEF`.
2. **La máquina de estados del jefe.** Es lo que más cambia el juego. No
   depende de ningún asset: se puede hacer hoy con lo que hay.
3. **El pasillo variable (opción C).** Depende de que llegue arte del
   foreground con alfa limpio para sacar el perfil.
4. **Más rocas y más variadas** por el camino, que ya funcionan.
5. **Tope de arma por sector: aparcado.** Estrechar la navegación cubre lo
   mismo y mejor.

---

## 6. Lo de Gradius III (2026-09-10)

Tres observaciones tuyas viendo Gradius. Comprobadas contra el código.

### "Parece que piensan"

No piensan: es **coreografía**. Y encontré el motivo exacto de que lo nuestro
no lo parezca — revisé `spawner.ts` y **las seis oleadas entran por el mismo
sitio**: `x = worldW + algo`. Todas. Siempre por el borde derecho, en fila y a
media altura.

Gradius mete escuadrones que entran **en arco desde una esquina, en bucle,
desde arriba en picado, o por detrás de ti**. Eso es lo que se lee como
inteligencia: no que cada enemigo sea listo, sino que las trayectorias se
crucen.

Es lo más barato de todo lo que hemos hablado: el registro de comportamientos
ya existe, solo faltan trayectorias nuevas. **No toca arquitectura.**

### Enemigos de tierra

Dependen del pasillo de §3: un enemigo de suelo necesita suelo. Con el perfil
de altura, uno de tierra es trivial — se pega al suelo de su columna, avanza
con el terreno y dispara hacia arriba.

Lo que cambia es grande: hoy volar bajo es seguro. Con torretas en las islas
deja de serlo, y la altura pasa a ser una decisión.

> Para el sector cielo no encajan coches. Encajan **torretas sobre las islas
> flotantes** y algo que camine por las ruinas. Los vehículos son para el
> sector "Rasante" del viaje (`ASSET_BRIEF` §9D), que sí es tierra.

### Los caminos que te aplastan — aquí hay un problema

⚠️ **Star Viper no tiene scroll forzado.** Comprobado: el jugador está
limitado a `x >= 19` y puede quedarse ahí parado para siempre. El fondo se
mueve, pero a ti nadie te empuja.

En Gradius la pantalla avanza y **tú vas dentro de ella**: si te quedas atrás,
el borde te mata. Por eso elegir mal el camino se paga. Sin esa presión,
"camino sin salida" solo significa "date la vuelta", que no da miedo.

Para tenerlo de verdad hay que hacer letal el borde izquierdo, y eso cambia el
juego entero: pasa de "me muevo libre" a "no puedo quedarme atrás". Es un
cambio grande y puede frustrar.

**Versión suave, que yo probaría primero:** caminos que se bifurcan donde el
malo no te mata, solo es **peor** — más estrecho, más torretas, sin espacio
para esquivar. Eliges con la misma tensión y sin castigo injusto. Si al
jugarlo te sabe a poco, entonces sí hacemos letal el borde.
