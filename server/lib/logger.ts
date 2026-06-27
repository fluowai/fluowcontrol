import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      },
  serializers: {
    req: (r) => ({
      method: r.method,
      url: r.url,
      headers: r.headers ? {
        'user-agent': r.headers['user-agent'],
        'content-type': r.headers['content-type'],
      } : undefined,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.token', '*.password', '*.token', '*.apiKey', '*.secret'],
    censor: '[REDACTED]',
  },
})

export default logger
