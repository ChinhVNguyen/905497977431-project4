import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { v4 as uuidv4 } from 'uuid';
import { updateAttachmentUrl } from '../../businessLogic/todos'


import { AttachmentUtils } from '../../helpers/attachmentUtils'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const attachmentUtils = new AttachmentUtils()

const logger = createLogger('attachment')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event: ', event)
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    // ##TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const attachmentId = uuidv4()

    let uploadUrl = await attachmentUtils.createAttachmentPresignedUrl(attachmentId);

    const attachmentUrl = await attachmentUtils.getAttachmentUrl(attachmentId)

    await updateAttachmentUrl(userId, todoId, attachmentUrl)
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl
      })
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    origin: '*',
    credentials: true
  })
)