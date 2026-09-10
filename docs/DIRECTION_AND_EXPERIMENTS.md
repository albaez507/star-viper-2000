# Dirección actual y aprendizajes del experimento Aether Viper

> Documento de contexto para el jugador y para cualquier modelo/agente que
> trabaje en este proyecto. Actualizado el 2026-09-10.

## 1. Repositorios: cuál es el canónico

`star-viper-2000/` es el repositorio normal y la fuente de verdad del juego.
Su nombre canónico es **Star Viper 2000** y su remoto es
`albaez507/star-viper-2000`.

`aether-viper/` es una copia experimental independiente creada para probar una
dirección visual anime moderna. No es una rama real dentro de Star Viper: tiene
su propio `.git`, aunque apunta al mismo remoto. Sus cambios no deben mezclarse
con el original ni subirse al remoto sin una instrucción explícita del jugador.

Regla para agentes: si el jugador dice **Star Viper 2000**, trabajar en
`star-viper-2000/`. Aether Viper sirve como referencia visual y experimento,
no como el producto principal.

## 2. Qué se aprendió de Aether Viper

### Legibilidad del encuadre

- Al menos un 60% de la pantalla debe estar ocupado por un fondo intencional;
  el objetivo preferido es aproximadamente 75% o más.
- La mayor parte del fondo debe estar limpia, especialmente alrededor de la
  banda central donde se juega. El fondo no debe competir con naves, balas,
  enemigos, obstáculos ni drops.
- Un fondo oscuro facilita mucho identificar las entidades y sus proyectiles.
- Si el fondo es claro, la nave necesita contraste deliberado: contorno fuerte,
  sombra, aura o propulsor luminoso. No confiar solo en el color del casco.
- Esta regla aplica tanto al arte como a la composición de cada pantalla; un
  fondo bonito pero ruidoso en la zona de juego es un mal fondo.

### Animación barata pero comunicativa

Cuando no exista un sprite animado para cada estado, usar una nave estática con
un propulsor procedural: partículas, cono de fuego, brillo o variación de
intensidad detrás del motor. Es un workaround válido porque comunica velocidad,
dirección y respuesta al control con muy poco arte adicional.

El propulsor debe:

- salir por detrás de la nave y respetar su orientación;
- reaccionar al movimiento o aceleración, no ser una llama fija;
- usar una silueta estrecha y controlada para no parecer una explosión o
  escombros;
- poder usarse también en enemigos si se rediseñan como naves.

No crear ciclos de animación completos para cada nave como requisito inicial.
Primero resolver la lectura y la jugabilidad; después añadir frames donde
aporten algo real.

### Retos simultáneos

Los obstáculos mejoran el juego cuando fuerzan decisiones, no cuando aparecen
como decoración. La mezcla buscada es:

1. esquivar terreno u obstáculos;
2. decidir si desviarse para recoger un upgrade o Power Core;
3. eliminar enemigos que dan puntos;
4. sobrevivir a los proyectiles y patrones que hacen peligrosa la ruta.

El nivel debe combinar esos retos con intención, dejando ventanas de lectura y
sin convertir todo el campo en ruido.

## 3. Prioridad actual de desarrollo

La prioridad es terminar un prototipo sólido de **Órbita Sentinel**, el sector
espacial. Es el tramo más fácil de iterar porque permite concentrar el trabajo
en controles, colisiones, enemigos, armas, upgrades y ritmo sin depender de un
gran pipeline de fondos.

Orden recomendado:

1. cerrar el bucle jugable de Sentinel;
2. añadir rocas/cuevas espaciales con colisión y muerte al tocar;
3. rediseñar enemigos para abandonar la silueta de insecto;
4. probar encuentros que mezclen obstáculos, drops y enemigos puntuables;
5. ampliar habilidades y controles después de que la base sea estable;
6. volver a Jardines del Céfiro como siguiente entorno del viaje.

Jardines del Céfiro no se elimina. Se pospone como exploración posterior de
otros lugares, planetas y atmósferas cuando Sentinel ya tenga una base fiable.

## 4. Rediseño de enemigos para Sentinel

La dirección preferida es una flota de naves hostiles y naves alienígenas, no
insectos. Cada familia debe distinguirse primero por su silueta y patrón de
movimiento, y después por color o detalle.

Ideas de familias a explorar, sin convertirlas todavía en implementación:

- interceptores angulares de ataque rápido;
- naves alienígenas orgánico-mecánicas, pero claramente tecnológicas;
- bombarderos lentos con silueta pesada;
- drones en formación;
- una rival/élite con presencia propia;
- guardianes o maquinaria antigua para el jefe.

Todas las naves enemigas pueden usar el mismo lenguaje de propulsor
procedural, con color e intensidad específicos por familia. Eso mantiene viva
la escena aunque todavía no haya sprites animados.

## 5. Flight Deck y gestión de assets

El menú principal de Star Viper 2000 ahora funciona como un pequeño **Flight
Deck**: `START`, `ONE PLAYER`, `TWO PLAYER` (reservado) y `OPTIONS`. Dentro de
`OPTIONS` está `SPRITE MANAGEMENT`, una herramienta de desarrollo para probar
la lectura visual de Sentinel sin tocar la lógica de movimiento ni los patrones
de combate.

La gestión actual controla tres familias:

- `scout`: interceptor básico;
- `diver`: nave de picado;
- `formation`: dron de escuadrón.

Cada familia tiene tres variantes de color/silueta en una tira PNG. La variante
activa se guarda localmente con la clave `starviper.sentinel-assets.v1` y se
aplica en vivo al renderer. El propulsor procedural sigue siendo la animación
común de la flota: el asset define la nave y el código define la respuesta del
motor.

Regla para agentes: no confundir este gestor con un sistema final de mods. Es
un selector local de iteración artística; primero se valida contraste,
silueta, escala y lectura en combate. Cuando una variante se confirme, se
puede convertir en la asignación por defecto y retirar las alternativas.

## 6. Selección de naves y poses de vuelo

La selección del jugador ahora conserva `VULCAN` y `LANCE` y añade dos naves
rediseñadas: `PYRE`, agresiva y rápida, y `AEGIS`, más pesada y resistente.
Las dos nuevas tienen una tira de siete poses: nivelada, tres grados de morro
arriba y tres grados de morro abajo. El código no rota la imagen libremente:
acumula el tiempo de la dirección vertical, avanza por escalones cada ~120 ms y
vuelve al centro algo más rápido al soltar. Esa discretización produce la
sensación arcade de Gradius sin deformar una silueta lateral.

La nave siempre apunta hacia la derecha y los motores quedan a la izquierda.
El propulsor se mantiene fuera del sprite para que la misma animación
procedural pueda reaccionar a aceleración, dash y estado de cada nave.

## 7. Criterios antes de volver a generar assets

- Diseñar primero la silueta en negro plano y comprobar que se reconoce a
  tamaño de juego.
- Reservar espacio negativo alrededor de las entidades y en el centro de la
  pantalla.
- Elegir fondo y enemigo como pareja: si el fondo es claro, especificar el
  contraste de la nave en el mismo encargo.
- Pedir orientación explícita: la nave del jugador apunta hacia el avance y
  los enemigos hacia él.
- Entregar variantes dañadas solo cuando tengan valor jugable visible.
- Priorizar un asset fijo legible más un propulsor procedural sobre una
  animación compleja que reduzca la claridad.

Este documento guía la siguiente iteración de Sentinel; no sustituye los
detalles técnicos de `ASSET_BRIEF.md`, `LOGIC.md` ni `OBSTACULOS.md`.
