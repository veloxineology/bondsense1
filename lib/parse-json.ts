interface Participant {
  name: string
}

interface Message {
  sender_name?: string
  timestamp_ms?: number
  content?: string
  photos?: any[]
  videos?: any[]
  audio_files?: any[]
  sticker?: any
  reactions?: any[]
  is_geoblocked_for_viewer?: boolean
  // Additional fields that might be in Instagram exports
  type?: string
  users?: any[]
  conversation?: any
}

interface ChatData {
  participants?: Participant[]
  messages?: Message[]
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

  // Handle missing or empty data with defaults
  if (!chatData) {
    throw new Error("No chat data provided")
  }

  // Extract participants or use default names
  let participants: string[] = []

  // Try different participant structures that might be in Instagram exports
  if (chatData.participants && Array.isArray(chatData.participants) && chatData.participants.length > 0) {
    console.log("Found participants array:", chatData.participants)
    participants = chatData.participants.map((p) => p.name || "Unknown User")
  } else if (chatData.users && Array.isArray(chatData.users) && chatData.users.length > 0) {
    console.log("Found users array:", chatData.users)
    participants = chatData.users.map((u: any) => u.name || u.username || "Unknown User")
  } else if (chatData.conversation && chatData.conversation.participants) {
    console.log("Found conversation participants:", chatData.conversation.participants)
    participants = chatData.conversation.participants.map((p: any) => p.name || "Unknown User")
  } else {
    // Try to extract participant names from messages if participants array is not available
    console.log("No direct participants found, extracting from messages")
    const messages = chatData.messages || []
    const uniqueSenders = new Set<string>()

    messages.forEach((message) => {
      if (message.sender_name) {
        uniqueSenders.add(message.sender_name)
      }
    })

    participants = Array.from(uniqueSenders)
    console.log("Extracted participants from messages:", participants)

    // If still no participants found, use default names
    if (participants.length === 0) {
      console.log("No participants found, using defaults")
      participants = ["User 1", "User 2"]
    }
  }

  // Count messages by participant
  const messagesByParticipant: Record<string, number> = {}
  participants.forEach((name) => {
    messagesByParticipant[name] = 0
  })

  // Process messages
  const messages = chatData.messages || []
  console.log(`Processing ${messages.length} messages`)

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
  }

  console.log("Extracted chat data:", result)
  return result
}

export function combineMultipleChatData(parsedDataArray: ParsedChatData[]): ParsedChatData {
  console.log(`Combining ${parsedDataArray.length} chat data objects`)

  if (parsedDataArray.length === 0) {
    // Return default data structure if no data is available
    return {
      participants: ["User 1", "User 2"],
      messageCount: 0,
      messagesByParticipant: { "User 1": 0, "User 2": 0 },
      timeSpan: {
        start: new Date(),
        end: new Date(),
        durationDays: 1,
      },
      averageMessagesPerDay: 0,
    }
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

  let totalMessages = 0

  parsedDataArray.forEach((data) => {
    totalMessages += data.messageCount

    Object.entries(data.messagesByParticipant).forEach(([name, count]) => {
      if (messagesByParticipant[name] !== undefined) {
        messagesByParticipant[name] += count
      } else {
        // Handle case where a participant might be in one file but not in the initial set
        messagesByParticipant[name] = count
      }
    })
  })

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
