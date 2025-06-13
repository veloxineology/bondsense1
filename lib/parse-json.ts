interface Participant {
  name: string
}

interface Photo {
  uri: string
}

interface AudioFile {
  uri: string
  creation_timestamp: number
}

interface Share {
  link: string
  share_text: string
  original_content_owner: string
}

interface Message {
  sender_name: string
  timestamp_ms: number
  content?: string
  photos?: Photo[]
  audio_files?: AudioFile[]
  share?: Share
}

interface ChatData {
  participants?: Participant[]
  messages: Message[]
  title?: string
  // Additional fields that might be in Instagram exports
  thread_path?: string
  thread_type?: string
  magic_words?: any[]
  image?: any
  users?: any[]
  conversation?: any
}

export interface ParsedChatData {
  participants: string[]
  messageCount: number
  messagesByParticipant: Record<string, number>
  timeSpan: {
    start: Date
    end: Date
    durationDays: number
  }
  averageMessagesPerDay: number
  messages: Message[] // All messages including photos, audio, reels, and shares
  textMessages: Message[] // Only messages with text content for analysis
  mediaMessages: Message[] // Messages containing photos, audio, or shares
}

export async function parseJsonFile(file: File): Promise<ChatData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        console.log(`Reading file: ${file.name}`)
        const jsonText = event.target?.result as string
        console.log(`File content sample: ${jsonText.substring(0, 200)}...`)

        const jsonData = JSON.parse(jsonText)
        console.log(`Parsed JSON structure:`, Object.keys(jsonData))

        // Ensure we have the messages array
        if (!jsonData.messages || !Array.isArray(jsonData.messages)) {
          throw new Error("Invalid JSON format: messages array not found")
        }

        resolve(jsonData)
      } catch (error) {
        console.error(`Failed to parse JSON file ${file.name}:`, error)
        reject(new Error(`Failed to parse JSON file: ${error}`))
      }
    }

    reader.onerror = (error) => {
      console.error(`Error reading file ${file.name}:`, error)
      reject(new Error(`Error reading file: ${error}`))
    }

    reader.readAsText(file)
  })
}

export function extractChatData(chatData: ChatData): ParsedChatData {
  console.log("Extracting chat data from:", chatData)

  if (!chatData || !chatData.messages || !Array.isArray(chatData.messages)) {
    throw new Error("Invalid chat data format")
  }

  // Extract unique participants from messages
  const uniqueSenders = new Set<string>()
  chatData.messages.forEach((message) => {
    if (message.sender_name) {
      uniqueSenders.add(message.sender_name)
    }
  })

  const participants = Array.from(uniqueSenders)
  console.log("Extracted participants:", participants)

  // Count messages by participant
  const messagesByParticipant: Record<string, number> = {}
  participants.forEach((name) => {
    messagesByParticipant[name] = 0
  })

  // Process messages
  const messages = chatData.messages
  console.log(`Processing ${messages.length} messages`)

  // Separate text and media messages
  const textMessages = messages.filter(message => message.content && !message.share)
  const mediaMessages = messages.filter(message => message.photos || message.audio_files || message.share)

  messages.forEach((message) => {
    if (message.sender_name && messagesByParticipant[message.sender_name] !== undefined) {
      messagesByParticipant[message.sender_name]++
    }
  })

  // Calculate time span
  let startTime = new Date()
  let endTime = new Date()

  if (messages.length > 0) {
    const timestamps = messages.map((m) => m.timestamp_ms).filter((ts): ts is number => ts !== undefined)
    console.log(`Found ${timestamps.length} timestamps`)

    if (timestamps.length > 0) {
      startTime = new Date(Math.min(...timestamps))
      endTime = new Date(Math.max(...timestamps))
      console.log(`Time span: ${startTime.toISOString()} to ${endTime.toISOString()}`)
    }
  }

  const durationMs = endTime.getTime() - startTime.getTime()
  const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)))

  // Calculate average messages per day
  const totalMessages = messages.length
  const averageMessagesPerDay = Math.round(totalMessages / durationDays)

  const result = {
    participants,
    messageCount: totalMessages,
    messagesByParticipant,
    timeSpan: {
      start: startTime,
      end: endTime,
      durationDays,
    },
    averageMessagesPerDay,
    messages, // All messages including photos, audio, reels, and shares
    textMessages, // Only messages with text content for analysis
    mediaMessages // Messages containing photos, audio, or shares
  }

  console.log("Extracted chat data:", result)
  return result
}

export function combineMultipleChatData(parsedDataArray: ParsedChatData[]): ParsedChatData {
  console.log(`Combining ${parsedDataArray.length} chat data objects`)

  if (parsedDataArray.length === 0) {
    throw new Error("No chat data to combine")
  }

  if (parsedDataArray.length === 1) {
    return parsedDataArray[0]
  }

  // Get unique participants across all chats
  const allParticipants = new Set<string>()
  parsedDataArray.forEach((data) => {
    data.participants.forEach((participant) => {
      allParticipants.add(participant)
    })
  })

  const participants = Array.from(allParticipants)
  console.log("Combined participants:", participants)

  // Combine message counts
  const messagesByParticipant: Record<string, number> = {}
  participants.forEach((name) => {
    messagesByParticipant[name] = 0
  })

  // Combine all messages
  const allMessages: Message[] = []
  const allTextMessages: Message[] = []
  const allMediaMessages: Message[] = []
  let totalMessages = 0

  parsedDataArray.forEach((data) => {
    totalMessages += data.messageCount
    allMessages.push(...data.messages)
    allTextMessages.push(...data.textMessages)
    allMediaMessages.push(...data.mediaMessages)

    Object.entries(data.messagesByParticipant).forEach(([name, count]) => {
      if (messagesByParticipant[name] !== undefined) {
        messagesByParticipant[name] += count
      } else {
        messagesByParticipant[name] = count
      }
    })
  })

  // Sort messages by timestamp
  allMessages.sort((a, b) => a.timestamp_ms - b.timestamp_ms)
  allTextMessages.sort((a, b) => a.timestamp_ms - b.timestamp_ms)
  allMediaMessages.sort((a, b) => a.timestamp_ms - b.timestamp_ms)

  // Find overall time span
  const allStartTimes = parsedDataArray.map((data) => data.timeSpan.start.getTime())
  const allEndTimes = parsedDataArray.map((data) => data.timeSpan.end.getTime())

  const overallStartTime = new Date(Math.min(...allStartTimes))
  const overallEndTime = new Date(Math.max(...allEndTimes))

  const overallDurationMs = overallEndTime.getTime() - overallStartTime.getTime()
  const overallDurationDays = Math.max(1, Math.ceil(overallDurationMs / (1000 * 60 * 60 * 24)))

  // Calculate overall average messages per day
  const overallAverageMessagesPerDay = Math.round(totalMessages / overallDurationDays)

  const result = {
    participants,
    messageCount: totalMessages,
    messagesByParticipant,
    timeSpan: {
      start: overallStartTime,
      end: overallEndTime,
      durationDays: overallDurationDays,
    },
    averageMessagesPerDay: overallAverageMessagesPerDay,
    messages: allMessages, // All messages including photos, audio, reels, and shares
    textMessages: allTextMessages, // Only messages with text content for analysis
    mediaMessages: allMediaMessages // Messages containing photos, audio, or shares
  }

  console.log("Combined chat data:", result)
  return result
}

export function formatDateRange(start: Date | number | null, end: Date | number | null): string {
  const isValidDate = (date: any): date is Date => date instanceof Date && !isNaN(date.getTime())

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }

  let startFormatted = "Invalid Date"
  let endFormatted = "Invalid Date"

  try {
    if (isValidDate(start)) {
      startFormatted = start.toLocaleDateString(undefined, options)
    } else if (typeof start === "number") {
      startFormatted = new Date(start).toLocaleDateString(undefined, options)
    }

    if (isValidDate(end)) {
      endFormatted = end.toLocaleDateString(undefined, options)
    } else if (typeof end === "number") {
      endFormatted = new Date(end).toLocaleDateString(undefined, options)
    }
  } catch (error) {
    console.error("Error formatting date range:", error)
    return "Date range unavailable"
  }

  return `${startFormatted} - ${endFormatted}`
}
