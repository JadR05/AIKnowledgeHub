import { mockPapers } from './mockData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

export async function getPapers({ topics = [] } = {}) {
  if (USE_MOCK_API) {
    const filteredPapers =
      topics.length > 0
        ? mockPapers.filter((paper) =>
            paper.topic.some((topic) => topics.includes(topic)),
          )
        : mockPapers

    return {
      success: true,
      count: filteredPapers.length,
      data: filteredPapers,
    }
  }

  const searchParams = new URLSearchParams()

  if (topics.length > 0) {
    searchParams.set('topic', topics.join(','))
  }

  const query = searchParams.toString()
  return request(`/papers${query ? `?${query}` : ''}`)
}

export async function getPaperById(id) {
  if (USE_MOCK_API) {
    const paper = mockPapers.find((item) => item._id === id)

    if (!paper) {
      throw new Error('The requested resource could not be found.')
    }

    return {
      success: true,
      data: {
        ...paper,
        views: paper.views + 1,
      },
    }
  }

  return request(`/papers/${id}`)
}

export async function createSubscription(payload) {
  if (USE_MOCK_API) {
    return createMockSubscription(payload)
  }

  return request('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

async function request(path, options = {}) {
  const hasBody = typeof options.body !== 'undefined'
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok || payload?.success === false) {
    throw new Error(getErrorMessage(payload, response.status))
  }

  return payload
}

function getErrorMessage(payload, statusCode) {
  if (payload?.error === 'Duplicate field value entered') {
    return 'This email is already subscribed.'
  }

  if (payload?.error) {
    return payload.error
  }

  if (payload?.message) {
    return payload.message
  }

  if (statusCode === 404) {
    return 'The requested resource could not be found.'
  }

  return 'Something went wrong while contacting the backend.'
}

function createMockSubscription(payload) {
  const email = payload?.email?.trim().toLowerCase()
  const topics = Array.isArray(payload?.subscribedTopics)
    ? payload.subscribedTopics
    : []

  if (!email || topics.length === 0) {
    throw new Error('Email and at least one topic are required')
  }

  const subscriptions = readMockSubscriptions()

  if (subscriptions.some((subscription) => subscription.email === email)) {
    throw new Error('This email is already subscribed.')
  }

  const newSubscription = {
    _id: `sub-${Date.now()}`,
    email,
    subscribedTopics: topics,
    createdAt: new Date().toISOString(),
  }

  writeMockSubscriptions([...subscriptions, newSubscription])

  return Promise.resolve({
    success: true,
    message: 'Mock subscription created successfully.',
    subscription: newSubscription,
  })
}

function readMockSubscriptions() {
  if (typeof window === 'undefined') {
    return []
  }

  const savedValue = window.localStorage.getItem('mock-subscriptions')

  if (!savedValue) {
    return []
  }

  try {
    return JSON.parse(savedValue)
  } catch {
    return []
  }
}

function writeMockSubscriptions(subscriptions) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    'mock-subscriptions',
    JSON.stringify(subscriptions),
  )
}
