document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('search');
  const cards = document.querySelectorAll('.card');
  const genButtons = document.querySelectorAll('.gen-btn');

  const params = new URLSearchParams(window.location.search);
  const activeBtn = document.querySelector('.gen-btn.active');
  let activeGen = activeBtn ? activeBtn.dataset.gen : (params.get('gen') || 'all');

  function filterCards() {
    const query = search.value.toLowerCase().trim();
    cards.forEach((card) => {
      const name = card.dataset.name;
      const gen = card.dataset.gen;
      const matchesName = name.includes(query);
      const matchesGen = activeGen === 'all' || gen === activeGen;
      card.style.display = matchesName && matchesGen ? '' : 'none';
    });
  }

  search.addEventListener('input', filterCards);

  genButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      genButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeGen = btn.dataset.gen;
      const url = new URL(window.location);
      if (activeGen === 'all') {
        url.searchParams.delete('gen');
      } else {
        url.searchParams.set('gen', activeGen);
      }
      history.replaceState(null, '', url);
      filterCards();
    });
  });

  filterCards();

  const scrollTopBtn = document.getElementById('scroll-top');
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
