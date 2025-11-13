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


export function formatDateToLong(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  const options = { day: "2-digit", month: "long", year: "numeric" };

  // "22 September 2025" formatda
  return date.toLocaleDateString("en-US", options);
}

export function formatDateToShort(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  const month = String(date.getMonth() + 1).padStart(2, "0"); // 0-based index
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}