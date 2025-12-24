window.onbeforeunload = function () {
  window.scrollTo(0, 0);
};

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------
     Lib Initialization & Contants
  --------------------------- */
  const notyf = new Notyf({ position: { x: 'center', y: 'top' } });
  const DPI = Math.min(window.devicePixelRatio || 1, 2);
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  document.body.classList.add('no-scroll');

  // const API_URL = `http://localhost:3000`;
  const API_URL = `https://v-kumakamewedding-api.erwww.in`;

  function viewportWidth() {
    return document.documentElement.clientWidth;
  }

  function viewportHeight() {
    return document.documentElement.clientHeight;
  }

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

  const timeStampFormat = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  function updateDateTimeElements() {
    const parts = dateFormat.format(EVENT_START_DATE).split(' ');
    const formattedDate = `${parts[0].replace(',', '')}, <br style="display:none;" />${parts.slice(1).join(' ')}`;
    const formattedTimeRange = `${timeFormat.format(EVENT_START_DATE)} - ${timeFormat.format(EVENT_END_DATE)}`;
    document.querySelectorAll('[data-date]').forEach((el) => (el.innerHTML = formattedDate));
    document.querySelectorAll('[data-time]').forEach((el) => (el.innerHTML = formattedTimeRange));
  }

  function formatTimestamp(timeString) {
    const date = new Date(timeString.replace(' ', 'T') + 'Z');
    return timeStampFormat.format(date);
  }

  /* ---------------------------
     Assets
  --------------------------- */

  const BGM_PATHS = ['/bgm/bgm.mp3', '/bgm/bgm-alt.mp3'];
  const MAIN_IMAGES_PATHS = [
    `/images/bg-intro-overlay.webp`,
    `/images/bg-intro.webp`,
    `/images/bg-plant1.webp`,
    `/images/bg-plant2.webp`,
    `/images/bg-plant3.webp`,
    `/images/bg-plant4.webp`,
    `/images/border-edge-bottom-right.webp`,
    `/images/border-edge-top-left.webp`,
    `/images/bride.webp`,
    `/images/chandelier.webp`,
    `/images/couple.webp`,
    `/images/groom.webp`,
    `/images/sepiring-nusantara.webp`,
    ...new Array(8).fill('').map((_, idx) => `/images/gallery${idx + 1}.webp`),
  ];
  const CAT_FRAME_COUNT = 10;
  const CAT_IMAGES_PATHS = Array.from(
    { length: CAT_FRAME_COUNT },
    (_, i) => `/images/cat_walking_frames_transparent_bg/frame_${String(i + 1).padStart(4, '0')}.webp`
  );
  const TOTAL_LOAD_ASSET = BGM_PATHS.length + MAIN_IMAGES_PATHS.length + CAT_IMAGES_PATHS.length;
  const CAT_IMAGES = [];
  const BGM_AUDIOS = [];

  let loaded = 0;

  function preloadImages(src, totalAsset, onProgress) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        onProgress(loaded / totalAsset);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function preloadAudio(src, vol, totalAsset, onProgress) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = src;
      audio.preload = 'auto';
      audio.volume = vol;
      audio.loop = true;
      audio.onloadeddata = () => {
        loaded++;
        onProgress(loaded / totalAsset);
        resolve(audio);
      };
    });
  }

  function audioSupport() {
    const a = document.createElement('audio');
    const mp3 = !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
    if (mp3) return 'mp3';
    return false;
  }

  /* ---------------------------
     Intro Elements
  --------------------------- */

  const mainIntro = document.querySelector('#main-intro');
  const mainIntroEnterBtn = document.querySelector('#main-intro-enter-btn');
  const mainIntroEnterBtn2 = document.querySelector('#main-intro-enter-btn2');
  const mainLoading = document.querySelector('#main-loading');
  const mainLoadingPercentage = document.querySelector('#main-loading-percentage');

  function handleLoadingProgress(percentage) {
    mainLoadingPercentage.textContent = Math.floor(percentage * 100) + '%';
  }

  async function preloadAllAssets() {
    // Audio
    const isSupportAudio = audioSupport() === 'mp3';
    const audios = await Promise.all(
      BGM_PATHS.map((src) => {
        if (isSupportAudio) {
          return preloadAudio(src, 1, TOTAL_LOAD_ASSET, handleLoadingProgress);
        }
        loaded++;
        onProgress(loaded / totalAsset);
        return Promise.resolve();
      })
    );
    BGM_AUDIOS.push(...audios);

    // Images
    const mapper = (src) => preloadImages(src, TOTAL_LOAD_ASSET, handleLoadingProgress);
    await Promise.all(MAIN_IMAGES_PATHS.map(mapper));
    const cats = await Promise.all(CAT_IMAGES_PATHS.map(mapper));
    CAT_IMAGES.push(...cats);
  }

  function handleMainIntroEnter(audioIdx = 0, startAt = 0, volume = 1) {
    document.body.classList.remove('no-scroll');
    gsap.to(mainIntro, {
      y: `-100%`,
      duration: 0.8,
      onComplete: () => {
        setupAfterIntro();
      },
    });
    if (BGM_AUDIOS.length > 0) {
      BGM_AUDIOS[audioIdx].currentTime = startAt;
      BGM_AUDIOS[audioIdx].volume = volume;
      BGM_AUDIOS[audioIdx].play();
    }
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

  function setupMainLoadingGifAnimation() {
    gsap.from('#main-loading img', {
      height: 0,
      duration: 0.4,
      ease: 'power2.in',
    });
  }

  /* ---------------------------
     Gallery Animation
  --------------------------- */

  let galleryTL; // keep reference

  function buildGalleryAnimation() {
    if (galleryTL) {
      galleryTL.scrollTrigger.kill();
      galleryTL.kill();
    }

    function center(el) {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 + window.scrollX,
        y: r.top + r.height / 2 + window.scrollY,
      };
    }

    const rootStyles = window.getComputedStyle(document.documentElement);
    const galleryGutter = rootStyles.getPropertyValue('--gallery-gutter')?.replace('px', '');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    const MOVE_FACTOR = isMobile ? 0.3 : 0.5;
    const MIN_SCALE = 0;
    const SCRUB_VAL = 1;
    const FEATURED_GUTTER = galleryGutter ? parseInt(galleryGutter, 10) : 32;

    const contentContainer = document.querySelector(`#gallery .content`);
    const feature = document.querySelector('.featured img');
    const items = gsap.utils.toArray('.grid > div:not(.featured)');

    if (!feature) return;

    const featureOrigin = center(feature);
    // const contentRect = contentContainer.getBoundingClientRect();

    const itemData = items.map((el) => ({ el, center: center(el) }));
    const maxDist = Math.max(
      ...itemData.map((d) => Math.hypot(d.center.x - featureOrigin.x, d.center.y - featureOrigin.y))
    );

    galleryTL = gsap.timeline({
      scrollTrigger: {
        trigger: contentContainer,
        start: 'bottom bottom-=10%', // "bottom of element hits bottom of viewport"
        endTrigger: '#gallery',
        end: 'bottom bottom', // "bottom of container hits bottom of viewport"
        pin: contentContainer,
        pinSpacing: false,
        pinType: 'fixed',
        invalidateOnRefresh: true,
        scrub: SCRUB_VAL,
        // markers: true,
      },
    });

    galleryTL
      .set(feature, {
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        x: 0,
        y: 0,
      })
      .to(
        feature,
        {
          // width: () => contentRect.width - FEATURED_GUTTER,
          width: () => viewportWidth() - FEATURED_GUTTER,
          height: () => viewportHeight() - FEATURED_GUTTER,
          maxWidth: 'none',
          maxHeight: 'none',
          x: () => {
            const r = feature.getBoundingClientRect();
            // return -(r.left - contentRect.left - FEATURED_GUTTER / 2);
            return -(r.left - FEATURED_GUTTER / 2);
          },
          y: () => {
            const r = feature.getBoundingClientRect();
            return -(r.top - FEATURED_GUTTER / 2);
          },
          borderRadius: `2.5rem`,
          objectPosition: `top center`,
          ease: 'power1.inOut',
        },
        0
      );

    itemData.forEach(({ el, center }) => {
      const dist = Math.hypot(center.x - featureOrigin.x, center.y - featureOrigin.y);

      const t = dist / maxDist;

      galleryTL.to(
        el,
        {
          scale: gsap.utils.interpolate(0.9, MIN_SCALE, t),
          opacity: 0,
          x: (featureOrigin.x - center.x) * MOVE_FACTOR,
          y: (featureOrigin.y - center.y) * MOVE_FACTOR,
          ease: 'power3.inOut',
        },
        gsap.utils.interpolate(0.15, 0, t)
      );
    });
  }

  /* ---------------------------
     Other Animation
  --------------------------- */

  function setupOtherAnimations(horizontalTween) {
    gsap.utils.toArray(['#reservation .content']).forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 80,
        duration: 0.8,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: el,
          start: 'center-=20% bottom',
          toggleActions: 'play none none reverse',
        },
      });
    });

    gsap.from('#ending .ending-top-wrapper', {
      opacity: 0,
      y: 80,
      duration: 0.8,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: '#ending .ending-top-wrapper',
        start: 'top top+=20%',
        toggleActions: 'play none none reverse',
      },
    });

    gsap.utils.toArray(['#groom-bride__bride', '#groom-bride__groom']).forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 80,
        duration: 0.8,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: el,
          containerAnimation: horizontalTween,
          start: 'left right-=20%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    gsap.utils.toArray(['#time-loc .content', '#countdown .content']).forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: -80,
        duration: 0.8,
        ease: 'power2.inOut',
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
      ease: 'power2.inOut',
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
  const attendanceFormSubmitBtn = document.querySelector('#attendance-form .submit-btn');
  const attendanceInput = document.querySelector('#attd_attendance');
  const attendanceButtons = attendanceForm.querySelectorAll('#attendance-form .attendance .action-btn');
  const messagesSection = document.querySelector('#messages');
  const messagesEmptyContainer = document.querySelector('#messages .message-empty');
  const messagesContentContainer = document.querySelector('#messages .message-content');
  const messagesListContainer = document.querySelector('#messages .message-list');
  const messagesPaginationInfo = document.querySelector('#messages .message-pagination-info');
  const messagesPaginationPrevBtn = document.querySelector('#messages .message-pagination-btn.btn-prev');
  const messagesPaginationNextBtn = document.querySelector('#messages .message-pagination-btn.btn-next');

  let currentPagination = { page: 1, totalPages: 1 };

  function focusMessagesSection() {
    messagesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateMessages(data) {
    messagesListContainer.innerHTML = data
      .map(
        (i) => `
          <div class="message-item">
            <p data-name>${i.name}</p>
            <p data-message>${i.message || '-'}</p>
            <p data-date>${formatTimestamp(i.updatedAt)}</p>
          </div>
        `
      )
      .join('');
  }

  function updatePaginationDisplay(pagination) {
    currentPagination = pagination;
    messagesPaginationPrevBtn.disabled = !pagination.hasPrev;
    messagesPaginationNextBtn.disabled = !pagination.hasNext;
    messagesPaginationInfo.innerHTML = `Page ${pagination.page} of ${pagination.totalPages}`;
  }

  function loadMessages(page = 1, cb) {
    messagesPaginationPrevBtn.disabled = true;
    messagesPaginationNextBtn.disabled = true;

    fetch(`${API_URL}/api/attendance?page=${page}&limit=5`)
      .then((res) => {
        if (!res.ok) {
          notyf.error('Failed to get the messages. Please try again');
          return;
        }
        return res.json();
      })
      .then((res) => {
        const { data, pagination } = res;

        if (data.length > 0) {
          messagesEmptyContainer.style.display = 'none';
          messagesContentContainer.style.display = 'block';
          updateMessages(data);
          updatePaginationDisplay(pagination);
          cb?.();
        }
      })
      .catch((err) => {
        console.error(err);
        notyf.error('Failed to get the messages. Please try again');
      });
  }

  function submitReservationForm(data) {
    attendanceFormSubmitBtn.disabled = true;

    fetch(`${API_URL}/api/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) {
          notyf.error('Failed to submit form. Please try again');
          return;
        }
        return res.json();
      })
      .then((res) => {
        notyf.success(`Thank you for your response!`);
      })
      .catch((err) => {
        console.error(err);
        notyf.error('Failed to submit form. Please try again');
      })
      .finally(() => {
        attendanceForm.reset();
        attendanceButtons.forEach((btn) => btn.classList.remove('active'));
        attendanceFormSubmitBtn.disabled = false;
        loadMessages(1, focusMessagesSection);
      });
  }

  function toggleShowTotalGuestsInput(isShow) {
    const elInput = document.querySelector('#attd_guests');
    const elLabel = document.querySelector('#attd_guests_label');
    elInput.style.display = isShow ? 'block' : 'none';
    elLabel.style.display = isShow ? 'block' : 'none';
  }

  function setupReservationForm() {
    attendanceButtons.forEach((button) => {
      button.addEventListener('click', () => {
        attendanceInput.value = button.value;
        attendanceButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        toggleShowTotalGuestsInput(button.value !== 'no');
      });
    });

    attendanceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        name: attendanceForm.name.value,
        attendance: attendanceForm.attendance.value || 'no',
        totalGuests:
          attendanceForm.attendance.value === 'no'
            ? 0
            : attendanceForm.guests.value
            ? parseInt(attendanceForm.guests.value, 10)
            : 1,
        message: attendanceForm.message.value,
      };

      submitReservationForm(data);
    });

    messagesPaginationPrevBtn.addEventListener('click', () => {
      loadMessages(currentPagination.page - 1, focusMessagesSection);
    });
    messagesPaginationNextBtn.addEventListener('click', () => {
      loadMessages(currentPagination.page + 1, focusMessagesSection);
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
    setupMainLoadingGifAnimation();
    await preloadAllAssets();

    updateDateTimeElements();
    updateCountdownElements();
    setupReservationForm();

    const { updateCatOnScroll } = setupCatAnimation();
    const { horizontalTween } = setupHorizontalScroll(updateCatOnScroll);
    setupOtherAnimations(horizontalTween);
    buildGalleryAnimation();
    ScrollTrigger.addEventListener('refreshInit', buildGalleryAnimation); // Rebuild on resize / orientation change


    loadMessages();

    setTimeout(() => {
      mainLoading.hidden = true;
      // handleMainIntroEnter();
    }, 700);
    mainIntroEnterBtn.addEventListener('click', () => handleMainIntroEnter(0, 10, 0.8));
    mainIntroEnterBtn2.addEventListener('click', () => handleMainIntroEnter(1, 0, 0.8));
  }

  start();
});
