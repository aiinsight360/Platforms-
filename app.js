(function () {
  const ACCESS_HASH = '14860599f1708bc0986063b7194ec8cb13b5039b90f98d0ec871bfb1dab190c3';
  const SESSION_KEY = 'reign-reader-unlocked';

  const data = window.BOOK_DATA;

  if (!data) {
    throw new Error('BOOK_DATA is missing. Run the build script to generate the reader data.');
  }

  const titleEl = document.getElementById('bookTitle');
  const subtitleEl = document.getElementById('bookSubtitle');
  const proofEl = document.getElementById('bookProof');
  const downloadPdfEl = document.getElementById('downloadPdf');
  const coverImageEl = document.getElementById('coverImage');
  const statsEl = document.getElementById('stats');
  const calloutsEl = document.getElementById('callouts');
  const chapterNavEl = document.getElementById('chapterNav');
  const chapterCardsEl = document.getElementById('chapterCards');
  const salaryTableEl = document.getElementById('salaryTable');
  const roadmapEl = document.getElementById('roadmap');
  const pageGalleryEl = document.getElementById('pageGallery');
  const beanInputEl = document.getElementById('beanInput');
  const beanResultEl = document.getElementById('beanResult');
  const progressBarEl = document.getElementById('progressBar');
  const passwordGateEl = document.getElementById('passwordGate');
  const gateFormEl = document.getElementById('gateForm');
  const gateErrorEl = document.getElementById('gateError');
  const printReaderEl = document.getElementById('printReader');

  function renderMeta() {
    titleEl.textContent = data.title;
    subtitleEl.textContent = `${data.subtitle} | ${data.strapline}`;
    proofEl.textContent = data.proofline;
    downloadPdfEl.href = data.pdfFile;
    coverImageEl.src = data.coverImage;
    coverImageEl.alt = `${data.title} cover preview`;
  }

  function renderStats() {
    statsEl.innerHTML = '';
    data.stats.forEach((stat) => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `<strong>${stat.value}</strong><span>${stat.label}</span>`;
      statsEl.appendChild(card);
    });

    calloutsEl.innerHTML = '';
    data.callouts.forEach((callout) => {
      const item = document.createElement('li');
      item.textContent = callout;
      calloutsEl.appendChild(item);
    });
  }

  function renderChapters() {
    const fragment = document.createDocumentFragment();

    data.chapterMap.forEach((chapter) => {
      const navLink = document.createElement('a');
      navLink.href = `#${chapter.id}`;
      navLink.textContent = chapter.title;
      chapterNavEl.appendChild(navLink);

      const card = document.createElement('a');
      card.className = 'chapter-card';
      card.href = `#${chapter.id}`;
      card.innerHTML = `
        <span>Page ${chapter.page}</span>
        <h3>${chapter.title}</h3>
        <p>${chapter.teaser}</p>
      `;
      fragment.appendChild(card);
    });

    chapterCardsEl.appendChild(fragment);
  }

  function renderSalaryTable() {
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>${data.salaryColumns
      .map((column) => `<th scope="col">${column}</th>`)
      .join('')}</tr>`;

    const tbody = document.createElement('tbody');
    data.salaryTable.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = row.map((value) => `<td>${value}</td>`).join('');
      tbody.appendChild(tr);
    });

    salaryTableEl.appendChild(thead);
    salaryTableEl.appendChild(tbody);
  }

  function renderRoadmap() {
    const fragment = document.createDocumentFragment();

    data.roadmap.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'roadmap-card';
      card.innerHTML = `
        <span>${item.month}</span>
        <h3>${item.phase}</h3>
        <p><strong>Target:</strong> ${item.target}</p>
        <p>${item.focus}</p>
        <p><strong>Combined income:</strong> ${item.income}</p>
      `;
      fragment.appendChild(card);
    });

    roadmapEl.appendChild(fragment);
  }

  function renderPages() {
    const chapterLookup = new Map(data.chapterMap.map((chapter) => [chapter.page, chapter]));
    const fragment = document.createDocumentFragment();

    data.pages.forEach((page) => {
      const chapter = chapterLookup.get(page.page);
      const card = document.createElement('figure');
      card.className = `page-card${chapter ? ' is-anchor' : ''}`;
      if (chapter) {
        card.id = chapter.id;
      }

      const image = document.createElement('img');
      image.src = page.src;
      image.alt = `${data.title} page ${page.page}`;
      image.loading = page.page <= 4 ? 'eager' : 'lazy';
      image.decoding = 'async';

      const caption = document.createElement('figcaption');
      caption.className = 'page-caption';
      caption.innerHTML = `
        <span>Page ${page.page} of ${data.pageCount}</span>
        ${
          chapter
            ? `<span class="page-tag">${chapter.title}</span>`
            : '<span class="page-tag">Original ebook page</span>'
        }
      `;

      card.appendChild(image);
      card.appendChild(caption);
      fragment.appendChild(card);
    });

    pageGalleryEl.appendChild(fragment);
  }

  function updateBeanCalculator() {
    const beans = Number(beanInputEl.value) || 0;
    const usd = beans / 210;
    beanResultEl.textContent = `${beans.toLocaleString()} Beans ≈ ${usd.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    })}`;
  }

  async function hashPassword(value) {
    if (!window.crypto || !window.crypto.subtle) {
      return null;
    }

    const encoded = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  function unlockReader() {
    sessionStorage.setItem(SESSION_KEY, 'true');
    passwordGateEl.classList.add('is-hidden');
    document.body.style.overflow = '';
    gateErrorEl.textContent = '';
  }

  function lockReader() {
    passwordGateEl.classList.remove('is-hidden');
    document.body.style.overflow = 'hidden';
  }

  async function handleUnlock(event) {
    event.preventDefault();
    const formData = new FormData(gateFormEl);
    const password = String(formData.get('password') || '').trim();

    if (!password) {
      gateErrorEl.textContent = 'Enter the reader password to continue.';
      return;
    }

    const passwordHash = await hashPassword(password);

    if (passwordHash === null) {
      gateErrorEl.textContent =
        'This browser blocked secure password checks. Open the hosted HTTPS version of this reader and try again.';
      return;
    }

    if (passwordHash === ACCESS_HASH) {
      unlockReader();
      return;
    }

    gateErrorEl.textContent = 'That password did not match. Check the access key and try again.';
  }

  function updateProgressBar() {
    const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalScrollable > 0 ? (window.scrollY / totalScrollable) * 100 : 0;
    progressBarEl.style.width = `${Math.min(progress, 100)}%`;
  }

  function setupScrollSpy() {
    const links = Array.from(chapterNavEl.querySelectorAll('a'));
    const linkMap = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
    const pageAnchors = Array.from(document.querySelectorAll('.page-card.is-anchor'));

    if (!('IntersectionObserver' in window) || pageAnchors.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        links.forEach((link) => link.classList.remove('is-active'));
        const activeLink = linkMap.get(visible.target.id);
        if (activeLink) {
          activeLink.classList.add('is-active');
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0.15, 0.45, 0.75],
      }
    );

    pageAnchors.forEach((anchor) => observer.observe(anchor));
  }

  function setupEvents() {
    gateFormEl.addEventListener('submit', handleUnlock);
    beanInputEl.addEventListener('input', updateBeanCalculator);
    window.addEventListener('scroll', updateProgressBar, { passive: true });
    printReaderEl.addEventListener('click', () => window.print());
  }

  function init() {
    renderMeta();
    renderStats();
    renderChapters();
    renderSalaryTable();
    renderRoadmap();
    renderPages();
    updateBeanCalculator();
    updateProgressBar();
    setupEvents();
    setupScrollSpy();

    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      unlockReader();
    } else {
      lockReader();
    }
  }

  init();
})();
