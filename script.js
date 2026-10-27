/* Nácar: animación de scroll con un vídeo real de un diamante girando.
   Librerías: GSAP + ScrollTrigger (scroll) y Lenis (scroll suave).

   Cómo funciona:
   1. El vídeo no se reproduce solo: está en pausa.
   2. Al hacer scroll, GSAP calcula cuánto has bajado (de 0 a 1)
      y lo convierte en un segundo del vídeo. Si bajas, el diamante gira; si subes, gira hacia atrás.
   3. A la vez, GSAP mueve y escala el vídeo y va enseñando los textos de cada paso.
   4. El tono azul se lo da el CSS (ver .video-azul en styles.css), así sirve cualquier vídeo. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Título letra a letra ---------- */
  const titulo = document.getElementById('titulo');
  titulo.innerHTML = [...titulo.textContent].map(c => `<span class="letra" aria-hidden="true">${c}</span>`).join('');
  if (window.gsap && !reduce) {
    gsap.from('#titulo .letra', { yPercent: 60, opacity: 0, filter: 'blur(12px)', duration: 1.6, stagger: 0.08, ease: 'expo.out', delay: 0.2 });
  }

  /* ---------- 2. El vídeo ---------- */
  const video = document.getElementById('diamante');
  const aviso = document.getElementById('aviso-video');
  let duracion = 0;
  let objetivo = 0;   // segundo al que queremos llegar según el scroll
  let actual = 0;     // segundo que se está mostrando (se acerca poco a poco al objetivo)

  const listo = () => { duracion = video.duration || 0; video.pause(); };
  video.addEventListener('loadedmetadata', listo);
  if (video.readyState >= 1) listo();
  video.addEventListener('error', () => { aviso.hidden = false; });
  video.querySelector('source')?.addEventListener('error', () => { aviso.hidden = false; });

  // En iPhone el vídeo no deja saltar de segundo hasta que se ha tocado la pantalla una vez
  const desbloquear = () => {
    video.play().then(() => video.pause()).catch(() => {});
    removeEventListener('touchstart', desbloquear);
  };
  addEventListener('touchstart', desbloquear, { passive: true });

  // Cada fotograma acercamos el vídeo al segundo objetivo, para que el giro sea suave
  function frame() {
    if (duracion) {
      actual += (objetivo - actual) * 0.18;
      if (Math.abs(video.currentTime - actual) > 0.02 && !video.seeking) {
        video.currentTime = Math.min(duracion - 0.05, Math.max(0, actual));
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- 3. Scroll: Lenis + GSAP ScrollTrigger ---------- */
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.085 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const marcas = document.querySelectorAll('.paso-indicador');
  const barra = document.getElementById('progreso');
  const cortes = [0, 0.24, 0.5, 0.78];
  const escritorio = matchMedia('(min-width: 768px)').matches;

  // Posición inicial: en escritorio el diamante queda a la derecha del título
  gsap.set('#escena', { xPercent: escritorio ? 18 : 0, scale: escritorio ? 0.9 : 1 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#recorrido', start: 'top top', end: 'bottom bottom', scrub: 1,
      onUpdate: s => {
        // El scroll de 0 a 1 se convierte en segundos del vídeo
        objetivo = s.progress * duracion;
        barra.style.transform = `scaleX(${s.progress})`;
        let idx = 0; cortes.forEach((c, i) => { if (s.progress >= c) idx = i; });
        marcas.forEach((m, i) => m.dataset.activo = String(i === idx));
      }
    }
  });

  tl
    // Paso 1: el diamante se centra y se acerca
    .to('#paso-0', { autoAlpha: 0, y: -40, duration: 0.5 }, 0.15)
    .to('#escena', { xPercent: 0, scale: 1.35, duration: 1.4, ease: 'power2.inOut' }, 0.15)
    .fromTo('#paso-1', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.95)
    .to('#paso-1', { autoAlpha: 0, y: -40, duration: 0.5 }, 1.95)
    // Paso 2: se aleja y se va a la izquierda para dejar sitio a las medidas
    .to('#escena', { xPercent: escritorio ? -18 : 0, yPercent: escritorio ? 0 : -12, scale: 0.95, duration: 1.5, ease: 'power2.inOut' }, 1.9)
    .fromTo('#paso-2', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 2.6)
    .to('#paso-2', { autoAlpha: 0, y: -40, duration: 0.5 }, 3.65)
    // Paso 3: el diamante sube, se hace pequeño y se apaga
    .to('#escena', { xPercent: 0, yPercent: -55, scale: 0.45, opacity: 0.15, duration: 1.2, ease: 'power2.in' }, 3.6)
    .fromTo('#paso-3', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 4.15)
    .to({}, { duration: 0.5 });
})();
