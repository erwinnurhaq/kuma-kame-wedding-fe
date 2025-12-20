window.onbeforeunload = function () {
  window.scrollTo(0, 0);
};

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------
     Lib Initialization
  --------------------------- */
  const DPI = Math.min(window.devicePixelRatio || 1, 2);
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  document.body.classList.add('no-scroll');

  /* ---------------------------
     Event Date & Time Formatting
  --------------------------- */
  const EVENT_START_DATE = new Date(2026, 1, 7, 9, 0, 0);
  const EVENT_END_DATE = new Date(2026, 1, 7, 12, 0, 0);

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

  function updateDateTimeElements() {
    const parts = dateFormat.format(EVENT_START_DATE).split(' ');
    const formattedDate = `${parts[0].replace(',', '')}, ${parts.slice(1).join(' ')}`;
    const formattedTimeRange = `${timeFormat.format(EVENT_START_DATE)} - ${timeFormat.format(EVENT_END_DATE)}`;
    document.querySelectorAll('[data-date]').forEach((el) => (el.textContent = formattedDate));
    document.querySelectorAll('[data-time]').forEach((el) => (el.textContent = formattedTimeRange));
  }

  /* ---------------------------
     Assets
  --------------------------- */

  const MAIN_IMAGES_PATHS = [
    `/images/bg-intro.jpg`,
    `/images/bg-plant1.png`,
    `/images/bg-plant2.png`,
    `/images/bg-plant3.png`,
    `/images/bg-plant4.png`,
    `/images/border-edge-bottom-right.png`,
    `/images/border-edge-top-left.png`,
    `/images/bride.webp`,
    `/images/chandelier.png`,
    `/images/couple.png`,
    `/images/groom.webp`,
    `/images/sepiring-nusantara.png`,
  ];
  const CAT_FRAME_COUNT = 10;
  const CAT_IMAGES_PATHS = Array.from(
    { length: CAT_FRAME_COUNT },
    (_, i) => `/images/cat_walking_frames_transparent_bg/frame_${String(i + 1).padStart(4, '0')}.png`
  );
  const TOTAL_IMAGES = MAIN_IMAGES_PATHS.length + CAT_IMAGES_PATHS.length;
  const CAT_IMAGES = [];

  let loaded = 0;

  function preloadImages(src, total, onProgress) {
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

  /* ---------------------------
     Intro Elements
  --------------------------- */

  const mainIntro = document.querySelector('#main-intro');
  const mainIntroEnterBtn = document.querySelector('#main-intro-enter-btn');
  const mainLoading = document.querySelector('#main-loading');
  const mainLoadingPercentage = document.querySelector('#main-loading-percentage');

  function handleLoadingProgress(percentage) {
    mainLoadingPercentage.textContent = Math.floor(percentage * 100) + '%';
  }

  async function preloadAllAssets() {
    const mapper = (src) => preloadImages(src, TOTAL_IMAGES, handleLoadingProgress);
    await Promise.all(MAIN_IMAGES_PATHS.map(mapper));
    const cats = await Promise.all(CAT_IMAGES_PATHS.map(mapper));
    CAT_IMAGES.push(...cats);
  }

  function handleMainIntroEnter() {
    document.body.classList.remove('no-scroll');
    gsap.to(mainIntro, {
      y: `-100%`,
      duration: 0.8,
      onComplete: setupAfterIntro,
    });
  }

  /* ---------------------------
     Horizontal Scroll
  --------------------------- */
  function setupHorizontalScroll(onScrollUpdateCb) {
    const panelSection = document.querySelector('#panels');
    const panelContainer = document.querySelector('#panels-container');
    const scrollDistance = panelSection.scrollWidth - innerWidth;

    const horizontalTween = gsap.to(panelContainer, {
      x: -scrollDistance,
      ease: 'none',
      scrollTrigger: {
        trigger: panelSection,
        pin: true,
        start: 'top top',
        scrub: 1,
        end: () => `+=${scrollDistance}`,
        onUpdate: onScrollUpdateCb,
        invalidateOnRefresh: true,
      },
    });

    return { horizontalTween };
  }

  /* ---------------------------
     Bird Animation
  --------------------------- */

  function setupBirdAnimation() {
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
      birdSize: 1,
      speedLimit: 3.0,
      separation: 81.0,
      alignment: 19.0,
      cohesion: 19.0,
      quantity: 1.0,
      backgroundAlpha: 0.0,
    });
  }

  /* ---------------------------
     Cat Animation
  --------------------------- */

  function setupCatAnimation() {
    const canvasElements = document.querySelectorAll('.cat-canvas');
    const canvases = Array.from(canvasElements).map((canvas) => {
      const ctx = canvas.getContext('2d');
      canvas.width = (550 / 2) * DPI;
      canvas.height = (380 / 2) * DPI;
      ctx.scale(DPI, DPI);
      return { canvas, ctx };
    });

    let frameIndex = 0;
    let lastScroll = 0;
    let flipped = false;
    let needsRender = false;
    let targetDelta = 0;

    function render() {
      const frame = CAT_IMAGES[Math.floor(frameIndex) % CAT_FRAME_COUNT];
      if (!frame?.complete || frame.naturalWidth === 0) return;

      canvases.forEach(({ canvas, ctx }) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        if (flipped) {
          ctx.translate(canvas.width / DPI, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(frame, 0, 0, canvas.width / DPI, canvas.height / DPI);
        ctx.restore();
      });
    }

    function updateCatOnScroll(self) {
      const scrollPos = self.scroll();
      targetDelta = scrollPos - lastScroll;
      flipped = targetDelta > 0;
      lastScroll = scrollPos;
      needsRender = true;
    }

    function rafLoop() {
      if (needsRender) {
        frameIndex = (frameIndex + Math.abs(targetDelta) * 0.05) % CAT_FRAME_COUNT;
        render();
        needsRender = false;
      }
      requestAnimationFrame(rafLoop);
    }

    render();
    rafLoop();

    return { updateCatOnScroll };
  }

  /* ---------------------------
     Other Animation
  --------------------------- */

  function setupOtherAnimations(horizontalTween) {
    gsap.utils.toArray(['#surah-quote .content', '#reservation .content']).forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 80,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'center-=20% bottom',
          toggleActions: 'play none none reverse',
        },
      });
    });

    gsap.utils
      .toArray(['#groom-bride__bride', '#groom-bride__groom'])
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

    gsap.utils
      .toArray(['#time-loc .content', '#countdown .content'])
      .forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: -80,
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
      duration: 0.4,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: `#bird-canvas`,
        start: 'top+=25% top',
        toggleActions: 'play none none reverse',
      },
    });
  }

  /* ---------------------------
     Countdown
  --------------------------- */
  const countdownTarget = EVENT_START_DATE.getTime();
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

  /* ---------------------------
     Reservation Form
  --------------------------- */

  const attendanceForm = document.querySelector('#attendance-form');
  const attendanceInput = document.querySelector('#attd_attendance');
  const attendanceButtons = attendanceForm.querySelectorAll('#attendance-form .attendance .action-btn');

  function setupReservationForm() {
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
  }

  /* ---------------------------
     Init after intro
  --------------------------- */

  function setupAfterIntro() {
    setupBirdAnimation();
  }

  /* ---------------------------
     Boot
  --------------------------- */

  async function start() {
    await preloadAllAssets();
    mainLoading.hidden = true;
    mainIntroEnterBtn.addEventListener('click', handleMainIntroEnter);
    // handleMainIntroEnter();
    updateDateTimeElements();
    updateCountdownElements();
    setupReservationForm();
    const { updateCatOnScroll } = setupCatAnimation();
    const { horizontalTween } = setupHorizontalScroll(updateCatOnScroll);
    setupOtherAnimations(horizontalTween);
  }

  start();
});
