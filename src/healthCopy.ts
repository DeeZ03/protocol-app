/** Health-specific strings pending consolidation into the shared i18n catalogue. */
export const healthCopy = {
 'en-GB': {
  all:'All', day:'day', days:'days', steps:'steps', hour:'hour', hours:'hours',
  dailyAverages:'daily averages', bpLegend:'Teal: systolic · Navy: diastolic (daily averages)',
  addReading:'+ Add reading',
  unitExplanation:'Existing readings are converted for display, not changed.',
  measureGuide:'Use a flexible tape, level with the floor, without pulling it tight. Neck: below the Adam’s apple. Chest: fullest part. Waist: same landmark each time, typically midway between lowest rib and hip bone. Hips / glutes: widest part of buttocks. Arms: midpoint of upper arm, relaxed. Thighs: same distance below hip each time. Calves: widest point. Record left and right separately.',
 },
 es: {
  all:'Todo', day:'día', days:'días', steps:'pasos', hour:'hora', hours:'horas',
  dailyAverages:'medias diarias', bpLegend:'Turquesa: sistólica · Azul marino: diastólica (medias diarias)',
  addReading:'+ Añadir medición',
  unitExplanation:'Las mediciones existentes se convierten solo para mostrarlas; no se modifican.',
  measureGuide:'Utiliza una cinta métrica flexible, paralela al suelo y sin apretarla. Cuello: por debajo de la nuez. Pecho: por la parte más ancha. Cintura: mide siempre en el mismo punto, normalmente entre la última costilla y el hueso de la cadera. Caderas y glúteos: por la parte más ancha. Brazos: a mitad del brazo, relajado. Muslos: siempre a la misma distancia de la cadera. Pantorrillas: por la parte más ancha. Registra el lado izquierdo y el derecho por separado.',
 }
} as const;
export const getHealthCopy = (language:string) => healthCopy[language==='es'?'es':'en-GB'];
