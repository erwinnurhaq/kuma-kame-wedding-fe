$(window).on('beforeunload', function () {
  window.scrollTo(0, 0);
});

$(function () {
  /* ---------------------------
      Lib Initialization & Constants
  --------------------------- */
  $('body').addClass('no-scroll');
  const notyf = new Notyf({ position: { x: 'center', y: 'top' } });
  const DPI = Math.min(window.devicePixelRatio || 1, 2);

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const API_URL = `http://localhost:3000`;

  const viewportWidth = () => document.documentElement.clientWidth;
  const viewportHeight = () => document.documentElement.clientHeight;

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

    $('[data-date]').html(formattedDate);
    $('[data-time]').html(formattedTimeRange);
  }

  function formatTimestamp(timeString) {
    const date = new Date(timeString.replace(' ', 'T') + 'Z');
    return timeStampFormat.format(date);
  }

  /* ---------------------------
      Assets Preloading
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

  function onAssetProgress() {
    loaded++;
    $('#main-loading-percentage').text(Math.floor((loaded / TOTAL_LOAD_ASSET) * 100) + '%');
  }

  function preloadImages(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        onAssetProgress();
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function preloadAudio(src, vol) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = src;
      audio.preload = 'auto';
      audio.volume = vol;
      audio.loop = true;
      audio.onloadeddata = () => {
        onAssetProgress();
        resolve(audio);
      };
      audio.onerror = reject;
    });
  }

  async function preloadAllAssets() {
    const isSupportAudio = !!new Audio().canPlayType('audio/mpeg;').replace(/no/, '');

    const audios = await Promise.all(BGM_PATHS.map((src) => (isSupportAudio ? preloadAudio(src, 1) : (onAssetProgress(), Promise.resolve()))));
    BGM_AUDIOS.push(...audios);

    await Promise.all(MAIN_IMAGES_PATHS.map(preloadImages));
    const cats = await Promise.all(CAT_IMAGES_PATHS.map(preloadImages));
    CAT_IMAGES.push(...cats);
  }

  /* ---------------------------
      Transitions & Animations
  --------------------------- */
  function handleMainIntroEnter(audioIdx = 0, startAt = 0, volume = 1) {
    $('body').removeClass('no-scroll');
    gsap.to('#main-intro', {
      y: `-100%`,
      duration: 0.8,
      onComplete: () => setupBirdAnimation(),
    });

    if (BGM_AUDIOS[audioIdx]) {
      BGM_AUDIOS[audioIdx].currentTime = startAt;
      BGM_AUDIOS[audioIdx].volume = volume;
      BGM_AUDIOS[audioIdx].play();
    }
  }

  function setupHorizontalScroll(onScrollUpdateCb) {
    const $panelSection = $('#panels');
    const scrollDistance = $panelSection[0].scrollWidth - window.innerWidth;

    const horizontalTween = gsap.to('#panels-container', {
      x: -scrollDistance,
      ease: 'none',
      scrollTrigger: {
        trigger: '#panels',
        pin: true,
        scrub: 1,
        end: () => `+=${scrollDistance}`,
        onUpdate: onScrollUpdateCb,
        invalidateOnRefresh: true,
      },
    });
    return { horizontalTween };
  }

  function setupCatAnimation() {
    const $canvases = $('.cat-canvas');
    const contexts = $canvases
      .map(function () {
        const ctx = this.getContext('2d');
        this.width = (550 / 2) * DPI;
        this.height = (380 / 2) * DPI;
        ctx.scale(DPI, DPI);
        return ctx;
      })
      .get();

    let frameIndex = 0,
      lastScroll = 0,
      flipped = false,
      needsRender = false,
      targetDelta = 0;

    function render() {
      const frame = CAT_IMAGES[Math.floor(frameIndex) % CAT_FRAME_COUNT];
      if (!frame?.complete) return;

      contexts.forEach((ctx) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();
        if (flipped) {
          ctx.translate(ctx.canvas.width / DPI, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(frame, 0, 0, ctx.canvas.width / DPI, ctx.canvas.height / DPI);
        ctx.restore();
      });
    }

    function rafLoop() {
      if (needsRender) {
        frameIndex = (frameIndex + Math.abs(targetDelta) * 0.05) % CAT_FRAME_COUNT;
        render();
        needsRender = false;
      }
      requestAnimationFrame(rafLoop);
    }

    rafLoop();
    return {
      updateCatOnScroll: (self) => {
        const scrollPos = self.scroll();
        targetDelta = scrollPos - lastScroll;
        flipped = targetDelta > 0;
        lastScroll = scrollPos;
        needsRender = true;
      },
    };
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
  function updateCountdown() {
    const ms = EVENT_START_DATE.getTime() - Date.now();
    if (ms < 0) return;
    const s = Math.ceil(ms / 1000);
    $('#countdown-d').text(String(Math.floor(s / 86400)).padStart(2, '0'));
    $('#countdown-h').text(String(Math.floor((s % 86400) / 3600)).padStart(2, '0'));
    $('#countdown-m').text(String(Math.floor((s % 3600) / 60)).padStart(2, '0'));
    $('#countdown-s').text(String(s % 60).padStart(2, '0'));
    setTimeout(updateCountdown, 1000);
  }

  /* ---------------------------
      Reservation & Messages (AJAX)
  --------------------------- */
  let currentPagination = { page: 1, totalPages: 1 };

  function focusMessagesSection() {
    $('#messages')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function loadMessages(page = 1, cb) {
    $('.message-pagination-btn').prop('disabled', true);

    $.getJSON(`${API_URL}/api/attendance`, { page, limit: 5 })
      .done((res) => {
        const { data, pagination } = res;
        if (data.length > 0) {
          $('.message-empty').hide();
          $('.message-content').show();

          const items = data
            .map(
              (i) => `
            <div class="message-item">
              <p data-name>${i.name}</p>
              <p data-message>${i.message || '-'}</p>
              <p data-date>${formatTimestamp(i.updatedAt)}</p>
            </div>`
            )
            .join('');

          $('.message-list').html(items);

          currentPagination = pagination;
          $('.btn-prev').prop('disabled', !pagination.hasPrev);
          $('.btn-next').prop('disabled', !pagination.hasNext);
          $('.message-pagination-info').html(`Page ${pagination.page} of ${pagination.totalPages}`);
          cb?.();
        }
      })
      .fail(() => notyf.error('Failed to get the messages.'));
  }

  function setupReservationForm() {
    const $form = $('#attendance-form');
    const $attdButtons = $('.attendance .action-btn');

    $attdButtons.on('click', function () {
      const val = $(this).val();
      $('#attd_attendance').val(val);
      $attdButtons.removeClass('active');
      $(this).addClass('active');

      const isAttending = val !== 'no';
      $('#attd_guests, #attd_guests_label').toggle(isAttending);
    });

    $form.on('submit', function (e) {
      e.preventDefault();
      const $submitBtn = $('.submit-btn');
      $submitBtn.prop('disabled', true);

      const payload = {
        name: this.name.value,
        attendance: $('#attd_attendance').val() || 'no',
        totalGuests: $('#attd_attendance').val() === 'no' ? 0 : parseInt(this.guests.value) || 1,
        message: this.message.value,
      };

      $.ajax({
        url: `${API_URL}/api/attendance`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
      })
        .done(() => {
          notyf.success('Thank you for your response!');
          $form[0].reset();
          $attdButtons.removeClass('active');
          loadMessages(1, focusMessagesSection);
        })
        .fail(() => notyf.error('Failed to submit form.'))
        .always(() => $submitBtn.prop('disabled', false));
    });

    $('.btn-prev').on('click', () => loadMessages(currentPagination.page - 1, focusMessagesSection));
    $('.btn-next').on('click', () => loadMessages(currentPagination.page + 1, focusMessagesSection));
  }

  /* ---------------------------
      Main Bootstrapper
  --------------------------- */
  async function start() {
    updateDateTimeElements();

    // Initial GSAP loading animation
    gsap.from('#main-loading img', {
      height: 0,
      duration: 0.4,
      ease: 'power2.in',
    });

    await preloadAllAssets();

    const { updateCatOnScroll } = setupCatAnimation();
    const { horizontalTween } = setupHorizontalScroll(updateCatOnScroll);

    // Inject horizontalTween into other GSAP animations needed
    setupOtherAnimations(horizontalTween);

    updateCountdown();
    setupReservationForm();
    loadMessages();

    $('#main-intro-enter-btn').on('click', () => handleMainIntroEnter(0, 10, 0.8));
    $('#main-intro-enter-btn2').on('click', () => handleMainIntroEnter(1, 0, 0.8));

    setTimeout(() => $('#main-loading').attr('hidden', true), 700);
  }

  start();
});
