# Genetic Music Lab - Evolutionary Composition Engine

## Propósito
El **Genetic Music Lab** es un entorno experimental de composición musical basado en principios de biología evolutiva. El objetivo es permitir que los usuarios "cultiven" música, tratando las composiciones como genomas que pueden mutar, heredarse y evolucionar a lo largo de múltiples generaciones.

## Conceptos Fundamentales

### 1. El Genoma Musical
Cada pieza musical se define por un genoma (`MusicalGenome`) que contiene:
- **Loci Genéticos (Layers/Tracks)**: Capas de instrumentos (Drums, Bass, Melody).
- **Genes (Events)**: Eventos musicales individuales con propiedades de tiempo, duración, muestra (sample) y tono.
- **Reglas Regulatorias**: Parámetros que afectan la expresión del genoma (volumen, pitch global).
- **Linaje**: Un registro de su ascendencia y las mutaciones que lo formaron.

### 2. Dinámica Evolutiva
- **Mutación**: Cambios aleatorios en los genes.
  - **Conservadora**: Pequeños ajustes en el tiempo o tono.
  - **Radical**: Cambios estructurales, duplicaciones o re-aleatorización completa.
- **Selección Natural (Cámara de Selección)**: El usuario actúa como la presión selectiva, decidiendo explícitamente qué descendientes sobreviven ("Live") y cuáles son descartados ("Die") antes de avanzar a la siguiente generación.
- **Hibridación (Recombinación)**: El usuario puede optar por activar la recombinación entre dos supervivientes aleatorios. Si se activa, se genera un híbrido que combina segmentos de ambos genomas parentales antes de aplicar nuevas mutaciones.

### 3. Análisis de Mutaciones
Una herramienta visual que permite identificar la estabilidad genética:
- **Verde (Conservado)**: Genes presentes en toda la línea ancestral.
- **Amarillo (Compartido)**: Genes que han persistido en algunas generaciones o provienen de recombinación.
- **Rojo (Único)**: Mutaciones nuevas que no existen en los ancestros.

## Elementos Técnicos

### Stack Tecnológico
- **Frontend**: React 18+ con TypeScript.
- **Audio Engine**: [Tone.js](https://tonejs.github.io/) para síntesis en tiempo real y secuenciación precisa.
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/) para transiciones fluidas y feedback visual.
- **Estilos**: Tailwind CSS con un diseño minimalista y bilingüe.
- **Iconografía**: Lucide React.

### Estructura de Archivos Principal
- `/src/App.tsx`: Orquestador principal del estado y la UI.
- `/src/services/evolutionService.ts`: El "motor biológico" que maneja la generación, mutación y recombinación de genomas.
- `/src/hooks/usePlaybackEngine.ts`: Puente entre el genoma musical y el motor de audio de Tone.js.
- `/src/components/GenomeTimeline.tsx`: Visualización interactiva del fenotipo musical (el mapa de genes).
- `/src/translations.ts`: Sistema de internacionalización (EN/ES).

### Configuraciones Específicas
- **Prevención de Ruidos**: El sistema incluye una lógica de resolución de solapamientos (`resolveOverlaps`) que asegura que dos eventos del mismo instrumento no suenen simultáneamente, evitando saturación y ruidos digitales.
- **Compatibilidad Móvil**: Implementa un sistema de desbloqueo de audio mediante gestos del usuario para cumplir con las políticas de reproducción de navegadores móviles.
- **Modo de Análisis**: Capacidad de superponer hasta 5 generaciones simultáneamente para observar la deriva genética visualmente.

## Cómo Jugar
1. **Inicializar**: Elige un ancestro raíz para comenzar tu linaje.
2. **Evolucionar**: Ajusta la tasa de mutación y el enfoque (Drums, Bass, Melody) y haz clic en "Evolve".
3. **Seleccionar**: En la Cámara de Selección, marca cada descendiente como "Vivir" o "Morir".
4. **Recombinar**: Decide si quieres activar la recombinación entre sobrevivientes antes de pulsar "Pasar a la Siguiente Generación".
5. **Analizar**: Usa el botón de "Análisis de Mutaciones" para ver qué partes de tu música son ancestrales y cuáles son innovaciones recientes.
6. **Aprender**: Completa los desafíos de aprendizaje incluidos en el manual de instrucciones.

---
*Experimental Bio-Acoustic Research Project &copy; 2026*
**Created by Rafik Neme**
