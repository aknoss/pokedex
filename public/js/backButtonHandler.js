document.getElementById('back-btn').addEventListener('click', function () {
  if (document.referrer && new URL(document.referrer).origin === location.origin) {
    history.back();
  } else {
    location.href = '/';
  }
});
