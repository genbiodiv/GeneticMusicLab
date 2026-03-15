# Genetic Music Lab - Evolutionary Composition Engine

## Propósito
El **Genetic Music Lab** es un entorno experimental de composición musical basado en principios de biología evolutiva. El objetivo es permitir que los usuarios "cultiven" música, tratando las composiciones como genomas que pueden mutar, heredarse y evolucionar a lo largo de múltiples generaciones.

En este laboratorio, la música no se compone de forma tradicional; se cultiva mediante **evolución dirigida**. El usuario actúa como el agente de selección natural, guiando el linaje sonoro hacia formas cada vez más complejas o estéticas.

## Conceptos Fundamentales

### 1. El Genoma Musical
Cada pieza musical se define por un genoma (`MusicalGenome`) que contiene:
- **Loci Genéticos (Layers/Tracks)**: Capas de instrumentos (Drums, Bass, Melody).
- **Genes (Events)**: Eventos musicales individuales con propiedades de tiempo, duración, muestra (sample) y tono.
- **Reglas Regulatorias**: Parámetros que afectan la expresión del genoma (volumen, pitch global).
- **Linaje**: Un registro de su ascendencia y las mutaciones que lo formaron.

### 2. Dinámica Evolutiva
- **Mutación**: Cambios aleatorios en los genes.
  - **Simple (Conservadora)**: Pequeños ajustes en el tiempo o tono. Preserva la estructura central.
  - **Estructural (Radical)**: Cambios profundos, duplicaciones, inversiones o re-aleatorización completa de secciones.
- **Selección Natural (Cámara de Selección)**: El usuario decide explícitamente qué descendientes sobreviven ("Live") y cuáles se extinguen ("Die").
- **Hibridación (Recombinación)**: Mezcla de genomas de dos sobrevivientes para crear una descendencia con rasgos combinados.

### 3. Análisis de Mutaciones
Una herramienta visual que permite identificar la estabilidad genética:
- **Verde (Conservado)**: Genes presentes en toda la línea ancestral.
- **Amarillo (Compartido)**: Genes que han persistido en algunas generaciones.
- **Rojo (Único)**: Mutaciones nuevas que no existen en los ancestros.

## Manual del Laboratorio

### El Proceso Evolutivo
1. **Elige un ancestro musical**: Selecciona una canción inicial que funcionará como el genoma raíz. Esta pieza contiene el conjunto original de genes musicales.
2. **Define las reglas de cambio**: Escoge entre mutación simple o estructural. Puedes decidir qué partes del genoma (melodía, bajo, batería) estarán sujetas a cambio.
3. **Genera descendientes**: El sistema crea una población de variantes basadas en el genoma original.
4. **Selección**: Escucha cada descendiente y decide cuáles sobreviven. Los sobrevivientes se convierten en la base para la siguiente generación.
5. **Herencia y Recombinación**: Los sobrevivientes pueden mutar nuevamente o mezclarse entre sí (recombinación) para generar la siguiente población.

### Camino Evolutivo
El laboratorio permite explorar el linaje completo. Puedes viajar hacia atrás en el tiempo para observar cómo evolucionó la composición y comparar descendientes de distintas generaciones.

## Elementos Técnicos

### Stack Tecnológico
- **Frontend**: React 18+ con TypeScript.
- **Audio Engine**: [Tone.js](https://tonejs.github.io/) para síntesis en tiempo real y secuenciación precisa.
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/) para transiciones fluidas.
- **Estilos**: Tailwind CSS con diseño minimalista y bilingüe.

### Estructura de Archivos
- `/src/App.tsx`: Orquestador principal del estado y la UI.
- `/src/services/evolutionService.ts`: Motor biológico de mutación y recombinación.
- `/src/hooks/usePlaybackEngine.ts`: Puente con el motor de audio.
- `/src/components/GenomeTimeline.tsx`: Visualización interactiva del fenotipo musical.

---
*Experimental Bio-Acoustic Research Project &copy; 2026*
**Created by Rafik Neme**
