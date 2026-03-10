document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('search');
  const cards = document.querySelectorAll('.card');
  const genButtons = document.querySelectorAll('.gen-btn');

  search.addEventListener('input', () => {
    const query = search.value.toLowerCase().trim();
    cards.forEach(card => {
      const name = card.dataset.name;
      card.style.display = name.includes(query) ? '' : 'none';
    });
  });

  genButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      genButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});
