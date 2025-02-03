import { Bot, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { getResponse } from '../utils/index.js'

const NetworkSearch = () => {
	const [isOpen, setIsOpen] = useState(false)
	const [model, setModel] = useState('DeepSeek-R1')
	const [query, setQuery] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async () => {
		if (!query.trim() || loading) return

		setLoading(true)
		try {
			const response = await getResponse(query, [], progress => {
				console.log('Progress:', progress)
			})
			console.log('Response:', response)
		} catch (error) {
			console.error('对话请求失败:', error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div
			className="w-full h-[calc(100vh-24px)] bg-gray-100 rounded-xl
    overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400
     scrollbar-track-gray-100 flex flex-col">
			<div className="flex-1 p-2"></div>
			<div className="relative">
				{isOpen && (
					<div
						className="absolute bg-white border border-gray-300 rounded-md shadow-lg z-10 mt-2 w-[160px] max-w-md"
						style={{
							left: '0',
							right: '0',
							bottom: '160px',
						}}>
						<div className="py-1">
							{[
								'DeepSeek-R1',
								'Claude-3',
								'GPT-4',
								'Gemini Pro',
								'Llama-2',
								'Mistral-7B',
								'Mixtral-8x7B',
								'Yi-34B',
								'Qwen-72B',
								'SOLAR-10.7B',
								'Phi-2',
								'CodeLlama-34B',
							].map(item => (
								<div key={item} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm">
									{item}
								</div>
							))}
						</div>
					</div>
				)}
				<div
					onClick={() => setIsOpen(!isOpen)}
					className="ml-2 flex items-center px-3 py-2 border-b border-gray-200 hover:bg-gray-50 
					cursor-pointer w-[160px] rounded-xl active:scale-[0.98] transition-transform duration-100">
					<Bot className="w-4 h-4 text-gray-600" />
					<span className="text-sm text-gray-700 ml-2">DeepSeek-R1</span>
					<ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
				</div>

				<div
					className="relative rounded-md bg-white outline outline-1 -outline-offset-1 outline-gray-300 
            focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2
            focus-within:outline-indigo-600 m-2">
					<textarea
						value={query}
						onChange={e => setQuery(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								handleSubmit()
							}
						}}
						className="block w-full rounded-md bg-white px-3 py-1.5 text-base 
					text-gray-900 outline-none resize-none h-24
					placeholder:text-gray-400 sm:text-sm/6"
						placeholder="请输入您的问题..."></textarea>
				</div>
			</div>
		</div>
	)
}

export { NetworkSearch }
