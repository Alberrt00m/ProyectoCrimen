initLevel({
  sceneItems: [
    { id: 'aceite',     img: 'image/aceite_verde.png',      name: 'Aceite de oliva' },
    { id: 'sarten',     img: 'image/sarten_morada.png',     name: 'Sartén morada' },
    { id: 'microondas', img: 'image/microondas_blanco.png', name: 'Microondas blanco' },
  ],
  decoyItems: [
    { id: 'pano',     img: 'image/paño_amarillo.png',    name: 'Paño amarillo' },
    { id: 'llaves',   img: 'image/llaves_plateadas.png', name: 'Llaves plateadas' },
    { id: 'pimienta', img: 'image/pimienta.png',         name: 'Pimienta' },
    { id: 'tasa',     img: 'image/tasa_roja.png',        name: 'Taza roja' },
  ],
  showInGrid: 2,
  onSuccess: () => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-next').classList.add('active');
  },
});