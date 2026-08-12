import { db } from '@code-trainer/db'

export async function bearerAuth(request: any, _reply: any, _params: any) {
  const token = request.cookies?.token ?? request.headers.authorization?.replace('Bearer ', '')

  if (!token) throw { statusCode: 401, message: 'Unauthorized' }

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    throw { statusCode: 401, message: 'Session expired' }
  }

  if (session.user.suspendedAt) {
    throw { statusCode: 403, message: 'Account suspended' }
  }

  request.user = session.user
}

/** Returns a valid user when credentials are present, otherwise undefined. */
export async function optionalUser(request: any) {
  const token = request.cookies?.token ?? request.headers.authorization?.replace('Bearer ', '')
  if (!token) return undefined
  const session = await db.session.findUnique({ where: { token }, include: { user: true } })
  if (!session || session.expiresAt < new Date() || session.user.suspendedAt) return undefined
  return session.user
}
