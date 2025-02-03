export const token = 'shareai-lm86isrosixq0j3qn7hgd2xeaa2ruydl'
export const baseUrl = 'https://s2bapi.zima.pet'
export const search = async query => {
	try {
		const response = await fetch(`${baseUrl}/common/notes/search/similar?limit=10`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				query_text: query,
			}),
		})

		if (!response.ok) {
			if (response.status === 401) {
				throw new Error('登录已过期，请重新登录')
			}
			throw new Error('Network response was not ok')
		}

		const result = await response.json()
		if (result.code !== 200) {
			throw new Error(result.msg || '请求失败')
		}
		console.log('result', result)
		return result.data
	} catch (error) {
		console.error('Error fetching first API:', error)
		throw error
	}
}

export const rerankNotes = async ({ query_text, notes, top_n }) => {
	try {
		const response = await fetch(`${baseUrl}/common/notes/rerank`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				query_text,
				notes,
				top_n,
			}),
		})

		if (!response.ok) {
			if (response.status === 401) {
				throw new Error('登录已过期，请重新登录')
			}
			throw new Error('Network response was not ok')
		}

		const result = await response.json()
		if (result.code !== 200) {
			throw new Error(result.msg || '请求失败')
		}

		return result.data
	} catch (error) {
		console.error('Error fetching second API:', error)
		throw error
	}
}
