import Status from '../components/Status'
import Header from '../components/Header'

export default function StatusPage() {
	return (
		<div className="flex flex-col items-center min-h-screen bg-gray-50">
			<Header />
			<Status />
		</div>
	)
}
