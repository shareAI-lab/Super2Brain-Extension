import { search, rerankNotes } from './service'
import { OpenAI } from 'openai'
import { getSystemPrompt } from './getSystemPrompt'

const MAX_CACHE_SIZE = 10
const searchCache = new Map()

const openai = new OpenAI({
	apiKey: 'sk-OSqhqCm1DoE24Kf0E2796eAeE75b484d9f08CbD779E7870a',
	baseURL: 'https://openai.super2brain.com/v1',
	dangerouslyAllowBrowser: true,
})

const generateSimilarQuestions = async (query, response, onProgress) => {
	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content:
						'你是一个帮助生成相关问题的AI助手。请基于用户的上一个问题和回答，生成3个后续问题。',
				},
				{
					role: 'user',
					content: `基于以下问题和回答，生成3个用户可能会继续追问的后续问题：
          
          原问题：${query}
          回答：${response}

          要求：
          1. 问题要对原问题进行深入探讨
          2. 寻求更多相关细节
          3. 探索相关但不同的方面

          请直接返回3个问题，每个问题占一行。`,
				},
			],
		})

		const questions = (completion.choices[0]?.message?.content || '')
			.split('\n')
			.filter(q => q.trim())

		onProgress?.({ stage: 5, questions })
		return questions
	} catch (error) {
		console.error('生成相似问题时发生错误:', error)
		return []
	}
}

const formatVectorResults = results => {
	return results
		.map(
			(item, index) => `
      文档 ${index + 1}:
      标题：${item.title || '无标题'}
      内容：${item.content || ''}
      正文：${item.polished_content || ''}
      ${item.short_summary ? `摘要：${item.short_summary}` : ''}
      -------------------`
		)
		.join('\n')
}

const getVector = async (query, onProgress) => {
	if (searchCache.has(query)) {
		return searchCache.get(query)
	} else {
		try {
			const results = await search(query)
			console.log('results', results)
			if (searchCache.size >= MAX_CACHE_SIZE) {
				const firstKey = searchCache.keys().next().value
				searchCache.delete(firstKey)
			}
			if (Object.keys(results).length > 0) {
				searchCache.set(query, Object.values(results))
			}

			onProgress?.({
				stage: 2,
				results: Object.values(results),
			})

			const formattedResults = formatVectorResults(Object.values(results))
			return formattedResults
		} catch (error) {
			console.error('搜索时发生错误:', error)
			throw new Error('搜索失败')
		}
	}
}

const tools = [
	{
		type: 'function',
		function: {
			name: 'rerank_search',
			description: '对搜索结果进行重排序，提高相关性',
			parameters: {
				type: 'object',
				properties: {
					query: { type: 'string' },
					top_n: {
						type: 'number',
						description: '返回前N个最相关的结果',
						default: 10,
					},
				},
				required: ['query'],
				additionalProperties: false,
			},
			strict: true,
		},
	},
	{
		type: 'function',
		function: {
			name: 'analysis_pre_content',
			description: '对上下文进行分析，查看是否需要将前面的聊天记录的内容添加到当前的搜索结果中',
			parameters: {
				type: 'object',
				properties: {
					messages: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								role: {
									type: 'string',
									enum: ['user', 'assistant'],
								},
								content: { type: 'string' },
							},
							required: ['role', 'content'],
						},
					},
				},
				required: ['messages'],
				additionalProperties: false,
			},
		},
	},
]

const formatFinalResponse = response => {
	return response.trim()
}

export const getResponse = async (query, preMessages, onProgress) => {
	onProgress?.({ stage: 1 })
	const initialResults = await getVector(query, onProgress)

	const messages = [
		{
			role: 'system',
			content: getSystemPrompt(initialResults, preMessages),
		},
		{
			role: 'user',
			content: query,
		},
	]

	const completion = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages,
		tools: tools,
	})

	const toolCalls = completion.choices[0].message.tool_calls
	if (toolCalls && toolCalls.length > 0) {
		const updatedMessages = [...messages, completion.choices[0].message]

		const toolResults = await Promise.all(
			toolCalls.map(async toolCall => {
				const args = JSON.parse(toolCall.function.arguments)

				if (toolCall.function.name === 'rerank_search') {
					const cachedResults = searchCache.get(query) || []
					const rerankedResults = await rerankNotes({
						query_text: query,
						notes: cachedResults,
						top_n: args.top_n || 10,
					})

					return {
						role: 'tool',
						content: JSON.stringify({
							type: 'rerank_results',
							results: Object.values(rerankedResults.data).map(note => ({
								title: note.title,
								content: note.content,
								summary: note.short_summary,
							})),
						}),
						tool_call_id: toolCall.id,
					}
				}

				if (toolCall.function.name === 'analysis_pre_content') {
					return {
						role: 'tool',
						content: JSON.stringify({
							type: 'context_analysis',
							previous_messages: args,
						}),
						tool_call_id: toolCall.id,
					}
				}

				return null
			})
		)

		const validToolResults = toolResults.filter(result => result !== null)
		const finalMessages = [...updatedMessages, ...validToolResults]

		const finalResponse = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: finalMessages,
			stream: true,
		})

		let accumulatedResponse = ''
		for await (const chunk of finalResponse) {
			const content = chunk.choices[0]?.delta?.content || ''
			accumulatedResponse += content
		}
		console.log('accumulatedResponse', accumulatedResponse)
		const formattedResponse = formatFinalResponse(accumulatedResponse)
		onProgress?.({
			stage: 3,
			response: formattedResponse,
		})

		await generateSimilarQuestions(query, formattedResponse, onProgress)

		return formattedResponse
	}

	const content = completion.choices[0].message.content || ''
	onProgress?.({
		stage: 3,
		response: content,
	})
	await generateSimilarQuestions(query, content, onProgress)
	return content
}
