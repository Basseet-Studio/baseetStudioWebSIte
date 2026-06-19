console.clear();
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

let ctx;

function createTimeline() {
  ctx && ctx.revert();

  ctx = gsap.context(() => {
    const box = document.querySelector(".box");
    const boxStartRect = box.getBoundingClientRect();

    // All containers except the first
    const containers = gsap.utils.toArray(".container:not(.initial)");

    // grab the points to animate between
    const points = containers.map((container) => {
      const marker = container.querySelector(".marker") || container;
      const r = marker.getBoundingClientRect();

      return {
        x: r.left + r.width / 2 - (boxStartRect.left + boxStartRect.width / 2),
        y: r.top + r.height / 2 - (boxStartRect.top + boxStartRect.height / 2)
      };
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".container.initial",
        start: "clamp(top center)",
        endTrigger: ".final",
        end: "clamp(top center)",
        scrub: 1
      }
    });

    tl.to(".box", {
      duration: 1,
      ease: "none",
      motionPath: {
        path: points, // array like - [{x:100, y:50}, {x:200, y:0}, {x:300, y:100}]
        curviness: 1.5 // adjust how curvy the path is, default is 1, 2 is more curvy
      }
    });
  });
}

createTimeline();
window.addEventListener("resize", createTimeline);
