export const Error = {
  NOT_REACHABLE: 'MyScript recognition server is not reachable. Please reload once you are connected.',
  WRONG_CREDENTIALS: 'Application credentials are invalid. Please check or regenerate your application key and hmackey.',
  TOO_OLD: 'Session is too old. Max Session Duration Reached.',
  NO_ACTIVITY: 'Session closed due to no activity.',
  CANT_ESTABLISH: 'Unable to establish a connection to the server. Check the host and your connectivity'
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

export const Exports = {
  JIIX: 'application/vnd.myscript.jiix'
} as const

export default {
  Error,
  EventType,
  Exports
} as const
