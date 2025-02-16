import React, { useEffect, useState } from 'react'
import CheckboxTree from 'react-checkbox-tree'
import 'react-checkbox-tree/lib/react-checkbox-tree.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	saveUserInput,
	getUserInput,
	getTaskList,
	clearUserInput,
	getItem,
	resetCounts,
} from '../../public/storage'
import {
	faCheckSquare,
	faSquare,
	faMinus,
	faChevronRight,
	faChevronDown,
	faPlusSquare,
	faMinusSquare,
	faFolder,
	faFolderOpen,
	faFile,
	faSpinner,
	faCheckCircle,
	faTimesCircle,
} from '@fortawesome/free-solid-svg-icons'

const fontAwesomeIcons = {
	check: <FontAwesomeIcon className="rct-icon rct-icon-check bg-white" icon={faCheckSquare} />,
	uncheck: <FontAwesomeIcon className="rct-icon rct-icon-uncheck bg-white" icon={faSquare} />,
	halfCheck: <FontAwesomeIcon className="rct-icon rct-icon-half-check" icon={faMinus} />,
	expandClose: <FontAwesomeIcon className="rct-icon rct-icon-expand-close" icon={faChevronRight} />,
	expandOpen: <FontAwesomeIcon className="rct-icon rct-icon-expand-open" icon={faChevronDown} />,
	expandAll: <FontAwesomeIcon className="rct-icon rct-icon-expand-all" icon={faPlusSquare} />,
	collapseAll: <FontAwesomeIcon className="rct-icon rct-icon-collapse-all" icon={faMinusSquare} />,
	parentClose: <FontAwesomeIcon className="rct-icon rct-icon-parent-close" icon={faFolder} />,
	parentOpen: <FontAwesomeIcon className="rct-icon rct-icon-parent-open" icon={faFolderOpen} />,
	leaf: <FontAwesomeIcon className="rct-icon rct-icon-leaf-close" icon={faFile} />,
}

export default function Index() {
	const [progressPercentage, setProgressPercentage] = useState(0)
	const [totalUrlsIndexed, setTotalUrlsIndexed] = useState(0)
	const [isProcessing, setIsProcessing] = useState(true)
	const [userInfo, setUserInfo] = useState(null)
	const [hasError, setHasError] = useState(false)
	const [hasToken, setHasToken] = useState(false)
	const [nodes, setNodes] = useState([])
	const [checked, setChecked] = useState([])
	const [expanded, setExpanded] = useState([])
	const [inputError, setInputError] = useState('')
	const [taskList, setTaskList] = useState([])
	const [status, setStatus] = useState({
		success: 0,
		failed: 0,
	})
	const [totalBookmarks, setTotalBookmarks] = useState(0)
	const onCheck = value => {
		setChecked(value)
	}

	const onExpand = value => {
		setExpanded(value)
	}

	useEffect(() => {
		const updateStats = async () => {
			const success = (await getItem('successCount')) || 0
			const failed = (await getItem('failedCount')) || 0
			setStatus({ success, failed })

			const processingStatus = await getItem('isProcessing')
			setIsProcessing(!!processingStatus)
		}

		updateStats()
		const interval = setInterval(updateStats, 1000)
		return () => clearInterval(interval)
	}, [])
	useEffect(() => {
		getUserInput().then(token => {
			if (token) {
				setHasToken(true)
			}
		})
		getTaskList().then(taskList => {
			setTaskList(taskList)
		})
		updateProgress()
	}, [])

	const updateProgress = () => {
		chrome.storage.local.get(['progress', 'totalUrlsIndexed', 'hasError'], storage => {
			setProgressPercentage(storage.progress || 0)
			setTotalUrlsIndexed(storage.totalUrlsIndexed || 0)
			setHasError(storage.hasError || false)
		})
	}

	const handleChooseBookmarks = () => {
		getAndDisplayBookmarkTree()
	}

	const handleSyncSelectedBookmarks = () => {
		if (!checked.length) {
			return
		}

		setTotalBookmarks(checked.length)
		setIsProcessing(true)
		chrome.storage.local.set({ isProcessing: true })
		resetCounts()

		syncBookmarks({
			folders: checked.filter(id => nodes.some(n => n.value === id && n.children)),
			bookmarks: checked.filter(id => !nodes.some(n => n.value === id && n.children)),
		})

		setNodes([])
		setChecked([])
		setExpanded([])
	}

	const getAndDisplayBookmarkTree = () => {
		chrome.bookmarks.getTree(bookmarks => {
			const formattedNodes = formatNodes(bookmarks[0].children)
			setNodes(formattedNodes)
			setExpanded(formattedNodes.map(node => node.value)) // Ensure first-level nodes are expanded by default.
		})
	}

	const formatNodes = nodes => {
		return nodes.map(node => ({
			value: node.id,
			label: node.title,
			children: node.children ? formatNodes(node.children) : [],
		}))
	}

	const displayBookmarkTree = (nodes, parentElement) => {
		return nodes.map(node => (
			<div key={node.id}>
				{node.children ? (
					<>
						<input
							type="checkbox"
							data-id={node.id}
							onChange={e => toggleFolderCheckbox(e.target.checked, node.id)}
							className="folder-checkbox"
						/>
						{node.title}
						{displayBookmarkTree(node.children)}
					</>
				) : (
					<>
						<input
							type="checkbox"
							data-id={node.id}
							className="bookmark-checkbox"
							onChange={() => toggleBookmarkCheckbox(node.id)}
						/>
						{node.title}
					</>
				)}
			</div>
		))
	}

	const toggleFolderCheckbox = (isChecked, folderId) => {
		let updatedFolders = [...selectedBookmarks.folders]
		if (isChecked) updatedFolders.push(folderId)
		else updatedFolders = updatedFolders.filter(id => id !== folderId)
		setSelectedBookmarks({ ...selectedBookmarks, folders: updatedFolders })
	}

	const toggleBookmarkCheckbox = bookmarkId => {
		let updatedBookmarks = [...selectedBookmarks.bookmarks]
		if (updatedBookmarks.includes(bookmarkId)) {
			updatedBookmarks = updatedBookmarks.filter(id => id !== bookmarkId)
		} else {
			updatedBookmarks.push(bookmarkId)
		}
		setSelectedBookmarks({ ...selectedBookmarks, bookmarks: updatedBookmarks })
	}

	const syncBookmarks = selectedItems => {
		chrome.runtime.sendMessage(
			{
				action: 'processBookmarks',
				items: selectedItems,
			},
			response => {
				if (response.status !== 'processing') {
					alert('An error occurred while processing your bookmarks. Please try again.')
				} else {
					alert(`导入 ${selectedItems.bookmarks.length} 个书签，请勿关闭浏览器`)
				}
			}
		)
	}

	const isDisabled = () => {
		return isProcessing
	}

	const validateAndSaveToken = value => {
		const trimmedValue = value.trim()
		if (trimmedValue.startsWith('shareai-') && trimmedValue.length > 8) {
			saveUserInput(trimmedValue)
			setHasToken(true)
			setInputError('')
			return true
		} else {
			setInputError('请输入正确的密钥')
			return false
		}
	}

	const openStatusPage = () => {
		chrome.tabs.create({
			url: chrome.runtime.getURL('status.html'),
		})
	}

	const handleClearToken = () => {
		clearUserInput()
		setHasToken(false)
	}

	const handleCloseStatus = async () => {
		// 重置状态
		setStatus({ success: 0, failed: 0 })
		// 清除存储的计数
		await resetCounts()
		// 清除处理状态
		setIsProcessing(false)
		chrome.storage.local.set({ isProcessing: false })
	}

	return (
		<div className="container p-4 bg-white rounded shadow-xl w-96">
			{!hasToken && (
				<>
					<div className="mb-4">
						<input
							type="text"
							className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							placeholder="请输入 shareai- 开头的密钥..."
							onChange={e => {
								setInputError('')
								e.target.value
							}}
							onKeyDown={e => {
								if (e.key === 'Enter') {
									validateAndSaveToken(e.target.value)
								}
							}}
						/>
						{inputError && <p className="mt-2 text-sm text-red-600">{inputError}</p>}
					</div>
					<button
						onClick={e =>
							validateAndSaveToken(e.target.previousElementSibling.querySelector('input').value)
						}
						className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
						设置密钥
					</button>
				</>
			)}
			{hasToken && (
				<div className="mt-4">
					<button
						onClick={handleClearToken}
						className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded hover:opacity-90 transition-opacity mb-2">
						删除Api Key
					</button>
					<button
						onClick={openStatusPage}
						className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded hover:opacity-90 transition-opacity">
						<svg
							className="mr-2"
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round">
							<path d="M12 20h9" />
							<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
						</svg>
						查看详细进度
					</button>
				</div>
			)}

			{totalUrlsIndexed > 0 && (
				<div className="flex justify-center items-center result-info text-indigo-500 mt-4 text-sm font-medium">
					{`${totalUrlsIndexed} Bookmark Indexed`}
				</div>
			)}

			{hasError && (
				<div className="flex justify-center items-center result-info text-red-500 mt-4 text-sm font-medium">
					Error occurred while processing bookmarks, please try again.
				</div>
			)}
			{hasToken && (
				<div className="flex justify-center items-center">
					<button
						id="processBookmarksButton"
						className={`text-white px-4 w-full py-2 my-2 rounded flex items-center justify-center ${
							isDisabled() ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500'
						}`}
						disabled={isDisabled()}
						onClick={handleChooseBookmarks}>
						{isDisabled() ? (
							<>
								<FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
								书签导入中
							</>
						) : (
							'选择书签导入'
						)}
					</button>
				</div>
			)}
			{(status.success > 0 || status.failed > 0) && (
				<div className="relative flex flex-col gap-2 justify-center items-center mt-4">
					<div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
						{!isDisabled() && (
							<button
								onClick={handleCloseStatus}
								className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor">
									<path
										fillRule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clipRule="evenodd"
									/>
								</svg>
							</button>
						)}

						{status.success > 0 && (
							<div className="flex items-center space-x-3 text-green-600 mb-4 bg-green-50 p-3 rounded-lg">
								<FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" />
								<span className="font-medium">成功导入: {status.success} 个书签</span>
							</div>
						)}

						{status.failed > 0 && (
							<div className="flex items-center space-x-3 text-red-600 mb-4 bg-red-50 p-3 rounded-lg">
								<FontAwesomeIcon icon={faTimesCircle} className="h-4 w-4" />
								<span className="font-medium">导入失败: {status.failed} 个书签</span>
							</div>
						)}

						<div className="mt-4">
							<div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
								<div
									className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
									style={{
										width: `${
											totalBookmarks
												? Math.round(((status.success + status.failed) / totalBookmarks) * 100)
												: 0
										}%`,
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			)}
			{nodes.length > 0 && (
				<div id="bookmark-selection-container" className="mt-8">
					<h3>选择书签或文件夹:</h3>
					<CheckboxTree
						nodes={nodes}
						checked={checked}
						expanded={expanded}
						icons={fontAwesomeIcons}
						onCheck={onCheck}
						onExpand={onExpand}
					/>
					<button
						id="syncSelectedBookmarksButton"
						className="bg-indigo-500 text-white w-full px-4 py-2 mt-4 rounded hover:bg-indigo-600 transition-colors"
						onClick={handleSyncSelectedBookmarks}>
						导入选中的书签
					</button>
				</div>
			)}
		</div>
	)
}