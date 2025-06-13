// This is a sample structure of an Instagram JSON export file
export const sampleInstagramJson = {
  participants: [
    {
      name: "Tanisha",
    },
    {
      name: "Kaushik",
    },
  ],
  messages: [
    {
      sender_name: "Tanisha",
      timestamp_ms: 1623456789000,
      content: "Hey, how are you doing today?",
      reactions: [],
    },
    {
      sender_name: "Kaushik",
      timestamp_ms: 1623456889000,
      content: "I'm doing great! Just finished that project we talked about.",
      reactions: [
        {
          reaction: "❤️",
          actor: "Tanisha",
        },
      ],
    },
    {
      sender_name: "Tanisha",
      timestamp_ms: 1623456989000,
      content: "That's awesome! Can't wait to see it.",
      reactions: [],
    },
    {
      sender_name: "Kaushik",
      timestamp_ms: 1623457089000,
      photos: [
        {
          uri: "messages/inbox/tanishakaushik_123456789/photos/1.jpg",
          creation_timestamp: 1623457089,
        },
      ],
    },
    {
      sender_name: "Tanisha",
      timestamp_ms: 1623457189000,
      content: "Wow, it looks amazing! You did such a great job.",
      reactions: [],
    },
  ],
  title: "Tanisha and Kaushik",
  is_still_participant: true,
  thread_path: "inbox/tanishakaushik_123456789",
  magic_words: [],
}
