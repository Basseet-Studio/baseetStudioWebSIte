MorphSVGPlugin.convertToPath("circle, rect, polygon");

const tl = gsap
  .timeline({
    repeat: 20,
    repeatDelay: 0.5,
    delay: 0.5,
    yoyo: true,
    defaults: { ease: "power2.inOut" }
  })
  .to("#triangle", { morphSVG: "#a" })
  .to("#square", { morphSVG: "#b" })
  .to("#circle", { morphSVG: "#c" });
