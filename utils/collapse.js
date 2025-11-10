export default function collapse(btn) {
	btn.classList.toggle('active')
	let body = btn.nextElementSibling
	if (body.style.maxHeight && body.style.maxHeight !== 'none') {
		body.style.maxHeight = null
	} else {
		body.style.maxHeight = body.scrollHeight + 'px'
	}
}

export const initCollapse = () => {
	const btns = document.querySelectorAll('[data-toggle="collapse"]')
	for (let btn of btns) {
		const body = btn.nextElementSibling
		btn.classList.contains('active') &&
			(body.style.maxHeight = body.scrollHeight + 'px')
	}
}
