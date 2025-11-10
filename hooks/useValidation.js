import { useIntl } from 'react-intl'

const useValidation = () => {
	const intl = useIntl()

	const nameValidation = (notRequired) => ({
		required: {
			value: notRequired ? false : true,
			message: intl.formatMessage({ id: '154' }),
		},
		maxLength: {
			value: 191,
			message: intl.formatMessage({ id: '284' }, { number: 191 }),
		},
	})

	const bodyValidation = (notRequired) => ({
		required: {
			value: notRequired ? false : true,
			message: intl.formatMessage({ id: '154' }),
		},
		maxLength: {
			value: 5000,
			message: intl.formatMessage({ id: '284' }, { number: 5000 }),
		},
	})

	const phoneValidation = (notRequired) => ({
		pattern: {
			value: /^998\s?\(?\d{2}\)?\s?\d{3}-?\d{2}-?\d{2}$/,
			message: intl.formatMessage({ id: '286' }),
		},
		required: {
			value: notRequired ? false : true,
			message: intl.formatMessage({ id: '154' }),
		},
	})

	const cardValidation = (notRequired) => ({
		pattern: {
			value: /\d{4}\s\d{4}\s\d{4}\s\d{4}$/,
			message: intl.formatMessage({ id: '287' }),
		},
		required: {
			value: notRequired ? false : true,
			message: intl.formatMessage({ id: '154' }),
		},
	})

	const passwordValidation = (notRequired) => ({
		minLength: {
			value: 8,
			message: intl.formatMessage({ id: '221' }, { number: 8 }),
		},
		required: {
			value: notRequired ? false : true,
			message: intl.formatMessage({ id: '154' }),
		},
	})

	const emailValidation = (notRequired) => ({
		required: {
			value: notRequired ? false : true,
			message: intl.formatMessage({ id: '154' }),
		},
		pattern: {
			value:
				/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
			message: intl.formatMessage({ id: '288' }),
		},
	})

	return {
		nameValidation,
		bodyValidation,
		phoneValidation,
		cardValidation,
		passwordValidation,
		emailValidation,
	}
}

export default useValidation
