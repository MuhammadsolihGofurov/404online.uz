import Skeleton from 'react-loading-skeleton'

const BannerSkeleton = () => {
	return (
		<div className='banner-skeleton'>
			<div className='banner-skeleton__inner'>
				<Skeleton width={'100%'} height={'100%'} />
			</div>
		</div>
	)
}

export default BannerSkeleton
