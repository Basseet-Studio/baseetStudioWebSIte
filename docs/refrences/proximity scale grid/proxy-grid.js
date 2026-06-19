
var stage = document.getElementById("stage");
var cards = gsap.utils.toArray(".card");
var radius = 200,
  maxScale = 2.5,
  dur = 0.35;

stage.addEventListener("mousemove", function (e) {
  var mx = e.clientX,
    my = e.clientY;
  cards.forEach(function (card) {
    var r = card.getBoundingClientRect();
    var d = Math.hypot(
      mx - (r.left + r.width / 2),
      my - (r.top + r.height / 2)
    );
    var p = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0, radius, 1, 0, d));
    gsap.to(card, {
      scale: 1 + (maxScale - 1) * p,
      overwrite: true,
      ease: "power2.out"
    });
  });
});

stage.addEventListener("mouseleave", function () {
  cards.forEach(function (card) {
    gsap.to(card, {
      scale: 1,
      duration: dur * 2,
      overwrite: true,
      ease: "power2.out"
    });
  });
});

document.getElementById("ctrlRadius").addEventListener("input", function () {
  radius = +this.value;
  document.getElementById("valRadius").textContent = radius + "px";
});
document.getElementById("ctrlScale").addEventListener("input", function () {
  maxScale = +this.value;
  document.getElementById("valScale").textContent = maxScale.toFixed(1) + "×";
});
document.getElementById("ctrlDur").addEventListener("input", function () {
  dur = +this.value;
  document.getElementById("valDur").textContent = dur.toFixed(2) + "s";
});
