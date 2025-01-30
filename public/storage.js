export async function setItem(key, value) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ [key]: value }, () => {
			if (chrome.runtime.lastError) {
				console.error('Chrome存储错误:', chrome.runtime.lastError)
				reject(chrome.runtime.lastError)
			} else {
				resolve()
			}
		})
	})
}

export async function getItem(key) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get([key], result => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError)
			} else {
				resolve(result[key])
			}
		})
	})
}

export async function getUserId() {
	const user = await getItem('user')
	return user && user.id ? user.id : null
}

export async function incrementItem(key, incrementBy = 1) {
	return getItem(key).then(currentValue => {
		const newValue = (currentValue || 0) + incrementBy
		return setItem(key, newValue).then(() => newValue)
	})
}

export async function saveUserInput(input) {
	return setItem('Super2BrainToken', input)
}

export async function getUserInput() {
	const token = await getItem('Super2BrainToken')
	return token
}

export async function clearUserInput() {
	await setItem('Super2BrainToken', null)
}

export async function getTaskList() {
	const taskList = await getItem('taskList')
	return taskList || []
}

export async function updateTaskList(taskList) {
	try {
		await setItem('taskList', taskList)

		const savedTasks = await getItem('taskList')

		return true
	} catch (error) {
		console.error('存储任务列表时出错:', error)
		throw error
	}
}

async function initializeStorage() {
  // 初始化计数器
  await setItem('successCount', 0);
  await setItem('failedCount', 0);
  await setItem('progress', 0);
  await setItem('hasError', false);
}


// 设置成功计数
export async function setSuccessCount(count) {
	return setItem('successCount', count);
}

// 设置失败计数
export async function setFailedCount(count) {
	return setItem('failedCount', count);
}

// 获取成功计数
export async function getSuccessCount() {
	return getItem('successCount') || 0;
}

// 获取失败计数
export async function getFailedCount() {
	return getItem('failedCount') || 0;
}

// 增加成功计数
export async function incrementSuccessCount() {
	const currentCount = await getSuccessCount();
	return setSuccessCount(currentCount + 1);
}

// 增加失败计数
export async function incrementFailedCount() {
	const currentCount = await getFailedCount();
	return setFailedCount(currentCount + 1);
}

// 重置计数器
export async function resetCounts() {
	await setSuccessCount(0);
	await setFailedCount(0);
}

export async function getDeepSeekApiKey() {
	const apiKey = await getItem('deepSeekApiKey')
	return apiKey || '';
}

export async function setDeepSeekApiKey(apiKey) {
	return setItem('deepSeekApiKey', apiKey);
}

export async function getDeepSeekBaseUrl() {
	const baseUrl = await getItem('deepSeekBaseUrl')
	return baseUrl || '';
}

export async function setDeepSeekBaseUrl(baseUrl) {
	return setItem('deepSeekBaseUrl', baseUrl);
}

