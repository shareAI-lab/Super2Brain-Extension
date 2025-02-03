import { BookOpen, Network, Send, Settings, MessageCircle } from 'lucide-react'

const ActivateBar = ({ activatePage, setActivatePage }) => {
	return (
		<div className="flex flex-col items-center space-y-2 pt-4 relative">
			<div
				className="absolute left-0 w-full h-9 transition-transform duration-200 ease-in-out"
				style={{
					transform: `translateY(${activatePage === -1 ? 185 : activatePage * 43 + 10}px)`,
					backgroundColor: 'rgb(243 232 255)',
					borderRadius: '0 9999px 9999px 0',
					boxShadow: 'inset 0px 2px 4px rgba(0,0,0,0.1)',
				}}
			/>

			<button className="rounded-r-full p-2 relative z-10" onClick={() => setActivatePage(0)}>
				<MessageCircle
					className={`w-5 h-5 transition-colors duration-200 ease-in-out
          ${activatePage === 0 ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'}`}
				/>
			</button>
			<button className="rounded-r-full p-2 relative z-10" onClick={() => setActivatePage(1)}>
				<Network
					className={`w-5 h-5 transition-colors duration-200 ease-in-out
          ${activatePage === 1 ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'}`}
				/>
			</button>
			<button className="rounded-r-full p-2 relative z-10" onClick={() => setActivatePage(2)}>
				<BookOpen
					className={`w-5 h-5 transition-colors duration-200 ease-in-out
          ${activatePage === 2 ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'}`}
				/>
			</button>
			<button className="rounded-r-full p-2 relative z-10" onClick={() => setActivatePage(3)}>
				<Send
					className={`w-5 h-5 transition-colors duration-200 ease-in-out
          ${activatePage === 3 ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'}`}
				/>
			</button>
			<button className="rounded-r-full p-2 relative z-10" onClick={() => setActivatePage(-1)}>
				<Settings
					className={`w-5 h-5 transition-colors duration-200 ease-in-out
          ${activatePage === -1 ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'}`}
				/>
			</button>
		</div>
	)
}

export { ActivateBar }
