// AdSense에서 만든 디스플레이 광고 단위의 숫자 data-ad-slot을 index.html에 입력하세요.
// 광고 단위를 연결하기 전에는 빈 광고 영역을 방문자에게 노출하지 않습니다.
const adPreview = new URLSearchParams(location.search).has('ad-preview');
const publisherId = 'ca-pub-6159780713962385';

for (const container of document.querySelectorAll('.site-ad')) {
  const slot = container.dataset.adSlot?.trim();
  if (!/^\d+$/.test(slot || '')) {
    if (adPreview) {
      container.hidden = false;
      container.classList.add('is-preview');
      container.append(document.createTextNode(container.classList.contains('site-ad-side')
        ? '측면 배너 광고 위치 · 미연결' : '상단 배너 광고 위치 · 미연결'));
    }
    continue;
  }

  const mount = () => {
    if (container.querySelector('.adsbygoogle')) return;
    const ad = document.createElement('ins');
    ad.className = 'adsbygoogle';
    ad.style.display = 'block';
    ad.dataset.adClient = publisherId;
    ad.dataset.adSlot = slot;
    ad.dataset.adFormat = 'auto';
    ad.dataset.fullWidthResponsive = 'true';
    container.append(ad);
    container.hidden = false;
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  };

  if (container.classList.contains('site-ad-side')) {
    const largeScreen = matchMedia('(min-width:1560px) and (min-height:780px)');
    if (largeScreen.matches) mount();
    else largeScreen.addEventListener('change', function onLargeScreen(event) {
      if (event.matches) { mount(); largeScreen.removeEventListener('change', onLargeScreen); }
    });
  } else mount();
}
