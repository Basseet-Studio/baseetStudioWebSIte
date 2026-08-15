// Custom language menu: site-styled list, not a native <select>.
// Event delegation survives AppBar persist innerHTML swaps.

const MENU_GAP = 8
const VIEWPORT_PAD = 12

function supportsPopover(): boolean {
  return typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype
}

function menuEl(root?: ParentNode | null): HTMLElement | null {
  return (root ?? document).querySelector<HTMLElement>("[data-lang-menu]")
}

function triggerEl(root?: ParentNode | null): HTMLButtonElement | null {
  return (root ?? document).querySelector<HTMLButtonElement>("[data-lang-trigger]")
}

function switcherEl(from?: Element | null): HTMLElement | null {
  return from?.closest<HTMLElement>("[data-lang-switcher]") ?? document.querySelector("[data-lang-switcher]")
}

function optionLinks(menu: HTMLElement): HTMLAnchorElement[] {
  return [...menu.querySelectorAll<HTMLAnchorElement>("[data-lang-option]")]
}

function isMenuOpen(menu: HTMLElement): boolean {
  if (supportsPopover() && typeof menu.matches === "function") {
    try {
      if (menu.matches(":popover-open")) return true
    } catch {
      /* :popover-open unsupported in selector engine */
    }
  }
  return menu.classList.contains("is-open")
}

function restoreMenu(menu: HTMLElement): void {
  const switcher = document.querySelector<HTMLElement>("[data-lang-switcher]")
  if (switcher && menu.parentElement !== switcher) {
    switcher.appendChild(menu)
  }
}

export function closeLangSwitcher(): void {
  const menu = menuEl()
  const trigger = triggerEl()
  const switcher = switcherEl(trigger)
  if (!menu) return

  if (supportsPopover() && typeof menu.hidePopover === "function") {
    try {
      menu.hidePopover()
    } catch {
      /* already closed */
    }
  }

  menu.classList.remove("is-open")
  switcher?.classList.remove("is-open")
  trigger?.setAttribute("aria-expanded", "false")
  restoreMenu(menu)
}

function positionMenu(trigger: HTMLElement, menu: HTMLElement): void {
  const rect = trigger.getBoundingClientRect()
  const menuWidth = Math.max(rect.width, menu.offsetWidth)
  const maxLeft = window.innerWidth - menuWidth - VIEWPORT_PAD
  let left = rect.left
  if (left > maxLeft) left = Math.max(VIEWPORT_PAD, maxLeft)
  if (left < VIEWPORT_PAD) left = VIEWPORT_PAD

  const below = rect.bottom + MENU_GAP
  const menuHeight = menu.offsetHeight || 0
  const top =
    below + menuHeight > window.innerHeight - VIEWPORT_PAD
      ? Math.max(VIEWPORT_PAD, rect.top - MENU_GAP - menuHeight)
      : below

  menu.style.top = `${top}px`
  menu.style.left = `${left}px`
  menu.style.minWidth = `${rect.width}px`
}

function setOpenState(open: boolean): void {
  const trigger = triggerEl()
  const menu = menuEl()
  const switcher = switcherEl(trigger)
  if (!trigger || !menu) return

  trigger.setAttribute("aria-expanded", String(open))
  switcher?.classList.toggle("is-open", open)
  menu.classList.toggle("is-open", open)

  if (open) {
    positionMenu(trigger, menu)
    const selected =
      optionLinks(menu).find((link) => link.getAttribute("aria-selected") === "true") ??
      optionLinks(menu)[0]
    selected?.focus()
  }
}

function openFallback(): void {
  const menu = menuEl()
  if (!menu || isMenuOpen(menu)) return
  document.body.appendChild(menu)
  setOpenState(true)
}

function toggleFallback(): void {
  const menu = menuEl()
  if (!menu) return
  if (isMenuOpen(menu)) closeLangSwitcher()
  else openFallback()
}

function onToggle(event: Event): void {
  const menu = event.target
  if (!(menu instanceof HTMLElement) || !menu.hasAttribute("data-lang-menu")) return
  const toggle = event as ToggleEvent
  setOpenState(toggle.newState === "open")
}

function onClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof Element)) return

  const trigger = target.closest("[data-lang-trigger]")
  if (trigger) {
    if (!supportsPopover()) {
      event.preventDefault()
      toggleFallback()
    }
    return
  }

  if (!target.closest("[data-lang-switcher]") && !target.closest("[data-lang-menu]")) {
    closeLangSwitcher()
  }
}

function onKeydown(event: KeyboardEvent): void {
  const menu = menuEl()
  if (!menu || !isMenuOpen(menu)) {
    if (event.key === "Escape") closeLangSwitcher()
    return
  }

  if (event.key === "Escape") {
    event.preventDefault()
    closeLangSwitcher()
    triggerEl()?.focus()
    return
  }

  const links = optionLinks(menu)
  if (links.length === 0) return

  const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement)
  let next = currentIndex

  if (event.key === "ArrowDown") next = currentIndex < 0 ? 0 : (currentIndex + 1) % links.length
  else if (event.key === "ArrowUp") next = currentIndex <= 0 ? links.length - 1 : currentIndex - 1
  else if (event.key === "Home") next = 0
  else if (event.key === "End") next = links.length - 1
  else return

  event.preventDefault()
  links[next]?.focus()
}

function repositionIfOpen(): void {
  const trigger = triggerEl()
  const menu = menuEl()
  if (!trigger || !menu || !isMenuOpen(menu)) return
  positionMenu(trigger, menu)
}

let bound = false

export function bindLangSwitcher(): void {
  if (bound) return
  bound = true

  document.addEventListener("click", onClick)
  document.addEventListener("keydown", onKeydown)
  document.addEventListener("toggle", onToggle, true)
  window.addEventListener("resize", repositionIfOpen)
  document.addEventListener("scroll", repositionIfOpen, true)
}

bindLangSwitcher()
