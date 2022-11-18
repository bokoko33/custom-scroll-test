const clamp = (min, value, max) => {
  return Math.max(min, Math.min(value, max));
};

const lerp = (start, end, amt) => {
  return (1 - amt) * start + amt * end;
};

export class CustomScroll {
  constructor() {
    // touch
    this.isTouch = false;
    this.isTouchDown = false;
    this.currentTouch = 0;
    this.prevTouch = 0;
    this.touchSpeed = 2.8;
    this.mouseDragSpeed = 1;

    // wheel
    this.wheelSpeed = 0.6;

    // common
    this.containerEl = null;
    this.target = 0;
    this.current = 0;
    this.limit = 0;
    this.isScrolling = false;

    this.direction = 'vertical';
    this.gestureDirection = 'vertical';

    this.rafId = 0;
    this.nowTime = 0;
  }

  onTouchDown = () => {
    this.isTouchDown = true;
  };

  onTouchMove = (e) => {
    e.preventDefault();

    if (!this.isTouchDown) return;

    // 現在のタッチ位置
    // マウスとタッチイベントで取得の方法が違うので条件分岐
    const touchEvent = e.touches ? e.touches[0] : e;

    // ジェスチャー方向に応じて移動量を取得
    this.currentTouch =
      this.gestureDirection === 'horizontal'
        ? touchEvent.clientX
        : touchEvent.clientY;

    const move = -(this.currentTouch - this.prevTouch);
    const value = this.prevTouch === 0 ? 0 : move; // 最初のタッチ時はprevが初期値0なので、moveが正しくない

    const speed = this.isTouch ? this.touchSpeed : this.mouseDragSpeed;

    this.updateTarget(value * speed);

    this.prevTouch = this.currentTouch;
  };

  onTouchUp = () => {
    this.isTouchDown = false;

    // リセット
    this.currentTouch = 0;
    this.prevTouch = 0;
  };

  onMouseWheel = (e) => {
    e.preventDefault();

    this.updateTarget(e.deltaY * this.wheelSpeed);
  };

  onScroll = () => {
    // 移動していない時は同期しておくことで、ページ内検索後も正しい位置で再開できる
    // このイベントはブラウザのスクロールバーでの移動でも発火するので、どちらの移動にも対応できる
    if (!this.isScrolling) {
      this.target = this.current = window.scrollY;
    }
  };

  onResize = () => {
    this.initElements();
  };

  updateTarget = (value) => {
    const newTarget = this.target + value;
    this.target = clamp(0, newTarget, this.limit);
  };

  raf = (timestamp) => {
    const deltaTime = timestamp - (this.nowTime || 0);
    this.nowTime = timestamp;

    this.current = lerp(this.current, this.target, 0.1);

    if (this.isScrolling) {
      // scroll中のみ位置を更新することで、ページ内検索を妨げない
      if (this.isTouch) {
        // touchデバイスではtransformで動かす（scrollToだとなめらかにならない）
        const y = this.current;
        this.containerEl.style.transform = `translate3d(0, ${-y}px, 0)`;
      } else {
        const position =
          this.direction === 'horizontal'
            ? [this.current, 0]
            : [0, this.current];

        window.scrollTo(...position);
      }
    }

    this.isScrolling = Math.abs(this.target - this.current) > 0.01;

    // 多分実際は他ファイルでやってるメインループかGSAPのtickerに突っ込む
    this.rafId = window.requestAnimationFrame(this.raf);
  };

  initElements = () => {
    this.isTouch = window.ontouchstart !== undefined;
    this.containerEl = document.querySelector('[data-scroll-container]');
    this.limit =
      this.direction === 'horizontal'
        ? this.containerEl.clientWidth - window.innerWidth
        : this.containerEl.clientHeight - window.innerHeight;
  };

  addEvents = () => {
    window.addEventListener('mousedown', this.onTouchDown);
    window.addEventListener('mousemove', this.onTouchMove);
    window.addEventListener('mouseup', this.onTouchUp);
    window.addEventListener('touchstart', this.onTouchDown);
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchUp);
    window.addEventListener('wheel', this.onMouseWheel, { passive: false });
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onScroll);

    // 多分実際は他ファイルでやってるメインループかGSAPのtickerに突っ込む
    this.rafId = window.requestAnimationFrame(this.raf);
  };

  removeEvents = () => {
    window.removeEventListener('mousedown', this.onTouchDown);
    window.removeEventListener('mousemove', this.onTouchMove);
    window.removeEventListener('mouseup', this.onTouchUp);
    window.removeEventListener('touchstart', this.onTouchDown);
    window.removeEventListener('touchmove', this.onTouchMove, {
      passive: false,
    });
    window.removeEventListener('touchend', this.onTouchUp);
    window.removeEventListener('wheel', this.onMouseWheel, { passive: false });
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll);

    // 多分実際は他ファイルでやってるメインループかGSAPのtickerに突っ込む
    window.cancelAnimationFrame(this.rafId);
  };
}
