type BoardEventType = 'board:changed'

interface ClientConnection {
  id: number
  send: (event: BoardEventType) => void
}

const clients: ClientConnection[] = []
let nextClientId = 1

export function registerRealtimeClient(send: ClientConnection['send']) {
  const connection: ClientConnection = { id: nextClientId++, send }
  clients.push(connection)

  return () => {
    const index = clients.findIndex((client) => client.id === connection.id)
    if (index !== -1) clients.splice(index, 1)
  }
}

export function publishBoardChanged() {
  for (const client of clients) {
    client.send('board:changed')
  }
}
