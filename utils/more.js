export const moreInit = (list) => {
	list.style.maxHeight = list.getAttribute('data-max-height') + 'px'
	list.style.overflow = 'hidden'
}

export const moreToggle = (
	btn,
	list,
	beforeText = 'Показать еще',
	afterText = 'Скрыть'
) => {
	const span = btn.querySelector('span')
	btn.querySelector('span')
	if (!btn.classList.contains('active')) {
		btn.classList.add('active')
		span ? (span.innerText = afterText) : (btn.innerText = afterText)
		list.classList.add('active')
	} else {
		btn.classList.remove('active')
		span ? (span.innerText = beforeText) : (btn.innerText = beforeText)
		list.classList.remove('active')
	}
}
