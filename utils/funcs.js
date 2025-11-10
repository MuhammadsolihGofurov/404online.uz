export const thousandSeperate = (data = '') => {
	return data
		.toString()
		.replace(/\s/g, '')
		.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export const roundPrice = (price, duration) => {
	return Math.ceil(price / duration / 1000) * 1000
}

export const isActive = ({ store, localStore, product }) => {
	if (store) {
		return store.items.some((item) => item.id === product.id) ? 1 : 0
	} else if (localStore) {
		return localStore.items.some((item) => item.id === product.id) ? 1 : 0
	} else {
		return 0
	}
}

export const removeQueryParam = ({ param, router }) => {
	const { pathname, query } = router
	const params = new URLSearchParams(query)
	params.delete(param)
	router.replace({ pathname, query: params.toString() }, undefined, {
		shallow: true,
	})
}

export const addQueryParam = ({ key, value, router }) => {
	const { pathname, query } = router
	const params = new URLSearchParams(query)
	params.append(key, value)
	router.replace({ pathname, query: params.toString() }, undefined, {
		shallow: true,
	})
}

export const updateQueryParam = ({ key, value, router }) => {
	const { query } = router
	router.push({ query: { ...query, [key]: value } }, undefined, {
		shallow: true,
	})
}
