window.onbeforeunload = function () {
  window.scrollTo(0, 0);
};

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------
     Lib Initialization
  --------------------------- */
  const dpi = window.devicePixelRatio || 1;
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  VANTA.BIRDS({
    el: '#bird-canvas',
    mouseControls: false,
    touchControls: false,
    gyroControls: false,
    minHeight: 400.0,
    minWidth: 400.0,
    scale: 1.0,
    scaleMobile: 1.0,
    backgroundColor: 0xffffff,
    color1: 0x747474,
    color2: 0xd4d4d4,
    colorMode: 'lerp',
    birdSize: 0.7,
    speedLimit: 3.0,
    separation: 81.0,
    alignment: 19.0,
    cohesion: 19.0,
    quantity: 2.0,
    backgroundAlpha: 0.0,
  });

  /* ---------------------------
     Event Date & Time Formatting
  --------------------------- */
  const eventStartDate = new Date(2026, 1, 7, 9, 0, 0);
  const eventEndDate = new Date(2026, 1, 7, 12, 0, 0);

  const dateFormat = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timeFormat = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  function formatDate(date) {
    const parts = dateFormat.format(date).split(' ');
    return `${parts[0]} ${parts.slice(1).join(' ')}`;
  }

  function updateDateTimeElements() {
    const formattedDate = formatDate(eventStartDate);
    const formattedTimeRange = `${timeFormat.format(eventStartDate)} - ${timeFormat.format(eventEndDate)}`;
    document.querySelectorAll('[data-date]').forEach((el) => (el.textContent = formattedDate));
    document.querySelectorAll('[data-time]').forEach((el) => (el.textContent = formattedTimeRange));
  }

  updateDateTimeElements();

  /* ---------------------------
     GSAP Animation
  --------------------------- */
  function setupHorizontalScrollPanels() {
    const container = document.querySelector('#panels-container');
    const panels = gsap.utils.toArray('.panel');

    const horizontalTween = gsap.to(panels, {
      x: () => -1 * (container.scrollWidth - innerWidth),
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        pin: true,
        start: 'top top',
        scrub: 1,
        end: () => `+=${container.scrollWidth - innerWidth}`,
      },
    });

    return horizontalTween;
  }

  function setupGSAPAnimation() {
    const horizontalTween = setupHorizontalScrollPanels();

    gsap.utils.toArray(['#surah-quote .content', '#reservation .content']).forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 80,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'center bottom',
          toggleActions: 'play none none reverse',
        },
      });
    });

    gsap.utils
      .toArray(['#groom-bride__bride', '#groom-bride__groom', '#time-loc .content', '#countdown .content'])
      .forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 80,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            containerAnimation: horizontalTween,
            start: 'left right-=20%',
            toggleActions: 'play none none reverse',
          },
        });
      });

    gsap.to(`#bird-canvas`, {
      autoAlpha: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: `#bird-canvas`,
        start: 'top+=25% top',
        toggleActions: 'play reverse play reverse',
      },
    });
  }

  setupGSAPAnimation();

  /* ---------------------------
     Cat Animation
  --------------------------- */
  const CAT_FRAME_COUNT = 10;
  const CAT_PATH = '/images/cat_walking_frames_transparent_bg/';
  const catImages = [];

  function getCatImagePaths() {
    return new Array(CAT_FRAME_COUNT).fill('').map((_, i) => `${CAT_PATH}frame_${String(i + 1).padStart(4, '0')}.png`);
  }

  function initCatAnimation() {
    const canvasElements = document.querySelectorAll('.cat-canvas');
    const canvases = Array.from(canvasElements).map((canvas) => {
      const ctx = canvas.getContext('2d');
      canvas.width = (550 / 2) * dpi;
      canvas.height = (380 / 2) * dpi;
      ctx.scale(dpi, dpi);
      return { canvas, ctx };
    });

    let frameIndex = 0;
    let lastScroll = 0;
    let flipped = false;

    function render() {
      const frame = catImages[Math.floor(frameIndex) % CAT_FRAME_COUNT];
      if (!frame?.complete || frame.naturalWidth === 0) return;

      canvases.forEach(({ canvas, ctx }) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        if (flipped) {
          ctx.translate(canvas.width / dpi, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(frame, 0, 0, canvas.width / dpi, canvas.height / dpi);
        ctx.restore();
      });
    }

    function handleScrollUpdate(self) {
      const scrollPos = self.scroll();
      const delta = scrollPos - lastScroll;
      flipped = delta > 0;

      if (Math.abs(delta) > 0) {
        frameIndex = (frameIndex + Math.abs(delta) * 0.05) % CAT_FRAME_COUNT;
        render();
      }

      lastScroll = scrollPos;
    }

    ScrollTrigger.create({
      trigger: '#panels-container',
      start: 'top top',
      end: () => `+=${document.querySelector('#panels-container').scrollWidth - innerWidth}`,
      scrub: 1,
      ease: 'elastic',
      onUpdate: handleScrollUpdate,
    });

    render();
  }

  /* ---------------------------
     Countdown
  --------------------------- */
  const countdownTarget = eventStartDate.getTime();
  const countdownD = document.querySelector('#countdown-d');
  const countdownH = document.querySelector('#countdown-h');
  const countdownM = document.querySelector('#countdown-m');
  const countdownS = document.querySelector('#countdown-s');

  function updateCountdownElements() {
    const now = Date.now();
    let msRemaining = countdownTarget - now;

    if (msRemaining <= 0) {
      // finished
      countdownD.textContent = '00';
      countdownH.textContent = '00';
      countdownM.textContent = '00';
      countdownS.textContent = '00';
      return;
    }

    const totalSeconds = Math.ceil(msRemaining / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownD.textContent = String(days).padStart(2, '0');
    countdownH.textContent = String(hours).padStart(2, '0');
    countdownM.textContent = String(minutes).padStart(2, '0');
    countdownS.textContent = String(seconds).padStart(2, '0');

    const nextTick = 1000 - (now % 1000);
    setTimeout(updateCountdownElements, nextTick + 6);
  }

  updateCountdownElements();

  /* ---------------------------
     Reservation Form
  --------------------------- */
  const attendanceForm = document.querySelector('#attendance-form');
  const attendanceInput = document.querySelector('#attd_attendance');
  const attendanceButtons = attendanceForm.querySelectorAll('#attendance-form .attendance .action-btn');

  attendanceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      attendanceInput.value = button.value;
      attendanceButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  attendanceForm.addEventListener('submit', (e) => {
    e.preventDefault(); // remove this if you want normal form submit
    console.log('Name:', attendanceForm.name.value);
    console.log('Attendance:', attendanceForm.attendance.value);
    console.log('Guests:', attendanceForm.guests.value);
    console.log('Message:', attendanceForm.message.value);
  });

  /* ---------------------------
     Main Intro
  --------------------------- */

  const mainIntro = document.querySelector('#main-intro');
  const mainIntroEnterBtn = document.querySelector('#main-intro-enter-btn');
  const mainLoading = document.querySelector('#main-loading');
  const mainLoadingPercentage = document.querySelector('#main-loading-percentage');

  const mainImagePaths = [
    `/images/bg-intro.jpg`,
    `/images/bg-plant1.png`,
    `/images/bg-plant2.png`,
    `/images/bg-plant3.png`,
    `/images/bg-plant4.png`,
    `/images/bride.jpg`,
    `/images/groom.jpg`,
    `/images/couple.png`,
  ];
  const catImagePaths = getCatImagePaths();
  const totalImageAssets = mainImagePaths.length + catImagePaths.length;

  let loaded = 0;

  function preloadImageWithProgress(src, total, onProgress) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        onProgress(loaded / total);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  async function preloadMainImageAssets() {
    await Promise.all(
      mainImagePaths.map((src) => preloadImageWithProgress(src, totalImageAssets, handleMainLoadingProgress))
    );
    const catImageObjects = await Promise.all(
      catImagePaths.map((src) => preloadImageWithProgress(src, totalImageAssets, handleMainLoadingProgress))
    );
    catImages.push(...catImageObjects);
  }

  function handleMainLoadingProgress(percentage) {
    mainLoadingPercentage.textContent = Math.floor(percentage * 100) + '%';
  }

  function handleMainIntroEnter() {
    mainIntro.setAttribute('hidden', '');
    document.body.classList.remove('no-scroll');
  }

  async function startIntro() {
    await preloadMainImageAssets();

    mainLoading.style.display = 'none';
    mainIntroEnterBtn.style.display = 'block';
    mainIntroEnterBtn.addEventListener('click', handleMainIntroEnter);
    initCatAnimation();
  }

  startIntro();
});
