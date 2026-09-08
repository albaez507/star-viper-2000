# net — reservado para multijugador

Vacío a propósito en la fase 1. Ver `docs/LOGIC.md` § 12 para el contrato
previsto (WebSocket, servidor autoritativo, Durable Objects de Cloudflare).

Cuando se implemente, este módulo solo debe hablar con `game/` a través de
`InputFrame` (entrada) y `GameState` serializado (snapshots) — nunca con
`render/`, `input/` ni `audio/`.
