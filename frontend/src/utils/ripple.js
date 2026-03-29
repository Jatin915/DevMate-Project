// Attach to onClick: onClick={ripple}
export function ripple(e) {
  const btn = e.currentTarget
  const circle = document.createElement('span')
  const rect = btn.getBoundingClientRect()
  circle.className = 'ripple'
  circle.style.top = `${e.clientY - rect.top}px`
  circle.style.left = `${e.clientX - rect.left}px`
  btn.appendChild(circle)
  circle.addEventListener('animationend', () => circle.remove())
}
