export const Error = {
  ABNORMAL_CLOSURE: 'MyScript recognition server is not reachable. Please reload once you are connected.',
  WRONG_CREDENTIALS: 'Application credentials are invalid. Please check or regenerate your application key and hmackey.',
  TOO_OLD: 'Session is too old. Max Session Duration Reached.',
  NO_ACTIVITY: 'Session closed due to no activity.',
  UNKNOW: 'An unknown error has occurred.',
  CANT_ESTABLISH: 'Unable to establish a connection to MyScript recognition server. Check the host and your connectivity.',
  GOING_AWAY: 'MyScript recognition server is going away, either because of a server failure or because the browser is navigating away from the page that opened the connection.',
  PROTOCOL_ERROR: 'MyScript recognition server terminated the connection due to a protocol error.',
  UNSUPPORTED_DATA: 'MyScript recognition server terminated the connection because the endpoint received data of a type it cannot accept. (For example, a text-only endpoint received binary data.)',
  INVALID_FRAME_PAULOAD: 'MyScript recognition server terminated the connection because a message was received that contained inconsistent data (e.g., non-UTF-8 data within a text message).',
  POLICY_VIOLATION: 'MyScript recognition server terminated the connection because it received a message that violates its policy.',
  MESSAGE_TOO_BIG: 'MyScript recognition server terminated the connection because a data frame was received that is too large.',
  INTERNAL_ERROR: 'MyScript recognition server terminated the connection because it encountered an unexpected condition that prevented it from fulfilling the request.',
  SERVICE_RESTART: 'MyScript recognition server terminated the connection because it is restarting.',
  TRY_AGAIN: 'MyScript recognition server terminated the connection due to a temporary condition, e.g. it is overloaded and is casting off some of its clients.',
  BAD_GATEWAY: 'MyScript recognition server was acting as a gateway or proxy and received an invalid response from the upstream server.',
  TLS_HANDSHAKE: 'MyScript recognition server connection was closed due to a failure to perform a TLS handshake'
} as const

export const EventType = {
  IDLE: 'idle',
  CHANGED: 'changed',
  IMPORTED: 'imported',
  EXPORTED: 'exported',
  CONVERTED: 'converted',
  RENDERED: 'rendered', // Internal use only
  LOADED: 'loaded',
  UNDO: 'undo',
  REDO: 'redo',
  CLEAR: 'clear',
  CLEARED: 'cleared',
  IMPORT: 'import',
  SUPPORTED_IMPORT_MIMETYPES: 'supportedImportMimeTypes',
  EXPORT: 'export',
  CONVERT: 'convert',
  ERROR: 'error'
} as const

export const WSEventType = {
  PART_CHANGE: 'part_change',
  CONTENT_CHANGE: 'content_change',
  PATCH: 'patch',
  EXPORTED: 'ws_exported',
  INITIALIZED: 'initialized',
  CONNECTED: 'connected',
  CONNECTION_ACTIVE: 'connection_active',
  DISCONNECTED: 'disconnected',
} as const

export const Exports = {
  JIIX: 'application/vnd.myscript.jiix'
} as const

export default {
  Error,
  EventType,
  Exports
} as const
