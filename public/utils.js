export const keepAlive = (() => {
	let intervalId

	return async state => {
		if (state && !intervalId) {
			chrome.runtime.getPlatformInfo(() => {})
			intervalId = setInterval(() => chrome.runtime.getPlatformInfo(() => {}), 20000)
		} else if (!state && intervalId) {
			clearInterval(intervalId)
			intervalId = null
		}
	}
})()

// 处理书签的逻辑
export async function processSelectedBookmarks(ids) {
	if (!Array.isArray(ids)) {
		throw new TypeError('Expected an array of IDs')
	}

	return new Promise((resolve, reject) => {
		chrome.bookmarks.getTree(tree => {
			const bookmarksMap = new Map()
			function traverse(nodes, parentTags = [], skipFirstLevel = true) {
				nodes.forEach(node => {
					if (skipFirstLevel && node.children) {
						traverse(node.children, parentTags, false)
					} else if (node.children && node.children.length > 0) {
						traverse(node.children, [...parentTags, node.title], false)
					} else if (node.url) {
						bookmarksMap.set(node.id, {
							url: node.url,
							title: node.title,
							tag: parentTags.join('/'),
						})
					}
				})
			}

			traverse(tree[0].children)

			// 返回选中的书签的信息
			const selectedNodes = ids.map(id => bookmarksMap.get(id)).filter(Boolean)

			resolve(selectedNodes)
		})
	})
}

export function splitArrayIntoChunks(array, chunkSize) {
	const result = []
	for (let i = 0; i < array.length; i += chunkSize) {
		result.push(array.slice(i, i + chunkSize))
	}
	return result
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchPageContent(url) {
	const maxRetries = 3
	let attempt = 0

	while (attempt < maxRetries) {
		try {
			const tab = await chrome.tabs.create({ url: url, active: false })

			const timeout = 30000
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => {
					chrome.tabs.remove(tab.id)
					reject(new Error('页面加载超时'))
				}, timeout)
			})

			const contentPromise = new Promise((resolve, reject) => {
				chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
					if (tabId === tab.id && info.status === 'complete') {
						chrome.scripting.executeScript(
							{
								target: { tabId: tab.id },
								files: ['turndown.js', 'readability.js'],
							},
							() => {
								chrome.scripting.executeScript(
									{
										target: { tabId: tab.id },
										function: () => {
											return new Promise((resolve, reject) => {
												try {
													const turndownService = new TurndownService()
													const reader = new Readability(document.cloneNode(true))
													const article = reader.parse()
													const markdown = turndownService.turndown(article?.content || '')
													resolve({
														markdown: markdown,
														title: document.title,
													})
												} catch (error) {
													reject(error)
												}
											})
										},
									},
									async results => {
										await chrome.tabs.remove(tab.id)
										if (results && results[0]) {
											resolve(results[0].result)
										} else {
											reject(new Error('提取内容失败'))
										}
									}
								)
							}
						)
					}
				})
			})

			return await Promise.race([contentPromise, timeoutPromise])
		} catch (error) {
			attempt++
			if (attempt === maxRetries) {
				throw error
			}
			await sleep(2000 * attempt)
		}
	}
}

export async function processUrlQueue(urls, delayBetweenRequests = 1000) {
	// 确保输入是数组
	if (!Array.isArray(urls)) {
		urls = [urls]
	}

	const results = []
	const errors = []

	// 顺序处理每个 URL
	for (const url of urls) {
		try {
			// 在每个请求之间添加延迟
			if (results.length > 0) {
				await sleep(delayBetweenRequests)
			}

			console.log(`正在处理: ${url}`)
			const content = await fetchPageContent(url)
			results.push({
				url,
				content,
				success: true,
			})
		} catch (error) {
			console.error(`处理 ${url} 失败:`, error)
			errors.push({
				url,
				error: error.message,
				success: false,
			})
		}
	}

	return {
		results, // 成功处理的结果
		errors, // 失败的记录
		total: urls.length,
		successful: results.length,
		failed: errors.length,
	}
}

export async function sendToBackend(data, token) {
	const endpoint = data.isPdf
		? 'https://api.super2brain.com/common/tasks/doc-note'
		: 'https://api.super2brain.com/common/tasks/content-note'

	const body = data.isPdf
		? { url: data.pdfUrl, title: data.title, fileName: data.pdfUrl }
		: { url: data.url, content: data.markdown, title: data.title }

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(body),
	})

	return response.json()
}
