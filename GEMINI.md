# MangaReadV1 — Contexto (Gemini CLI)

Gemini CLI: este proyecto usa `AGENTS.md` como fuente única de verdad para
mantener el contexto igual entre todos los agentes IA que usemos (Gemini CLI,
OpenCode, Claude Code, etc.). Importa ese archivo y los documentos de detalle:

@AGENTS.md
@docs/requisitos.md
@docs/base-de-datos.md
@docs/diseno.md
@docs/funcionalidades-extra.md
@docs/estado-actual.md

No dupliques instrucciones aquí — si necesitas agregar una regla específica
para Gemini CLI que no aplique a otros agentes, agrégala debajo de esta línea.
