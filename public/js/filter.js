document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('search');
  const cards = document.querySelectorAll('.card');
  const genButtons = document.querySelectorAll('.gen-btn');

  let activeGen = 'all';

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
      filterCards();
    });
  });
});
