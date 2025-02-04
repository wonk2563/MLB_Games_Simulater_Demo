import { defineEventHandler } from 'h3'
import MLBDataFetcher from '~/server/services/MLBDataFetcher'
import MLBDataPreprocessor from '~/server/services/MLBDataPreprocessor'
import MLBDataUploader from '~/server/services/MLBDataUploader'

const progressMap = new Map()
const fetchData = async (event) => {
  const { startDate, endDate } = await readBody(event)
  const fetcher = new MLBDataFetcher()

  try {
    await fetcher.fetchHistoricalGames(
      startDate,
      endDate,
      async (progress) => {
        // Send progress updates to client
        progressMap.set('download', progress);
      }
    )
  } catch (error) {
    // Send error message
    console.error('Server error:', error)

    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

const processData = async () => {
  const preprocessor = new MLBDataPreprocessor()

  try {
    await preprocessor.processRawData(
      async (progress) => {
        // Send progress updates to client
        const lastProgress = progressMap.get('preprocess') || {};
        progressMap.set('preprocess', { ...lastProgress, ...progress });
      }
    )
  }
  catch (error) {
    // Send error message
    console.error('Server error:', error)

    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

const uploadData = async () => {
  const uploader = new MLBDataUploader()

  try {
    await uploader.initVectorStore(
      (progress) => {
        // Send progress updates to client
        progressMap.set('upload', progress);
      }
    )
  }
  catch (error) {
    // Send error message
    console.error('Server error:', error)

    return {
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export default defineEventHandler(async (event) => {
  const { action } = await readBody(event)

  try {
    switch (action) {
      case 'fetch':
        fetchData(event)

        return { 
          success: true, 
          message: 'Data fetching' 
        }

      case 'getDownloadProgress':
        const d_progress = progressMap.get('download')

        return { 
            code: 200,
            progress: d_progress
        };

      case 'preprocess':
        processData()

        return { 
          success: true, 
          message: 'Data preprocessing' 
        }

      case 'getPreprocessProgress':
        const p_progress = progressMap.get('preprocess')

        return { 
            code: 200,
            progress: p_progress
        };

      case 'upload':
        uploadData()

        return { 
          success: true, 
          message: 'Data storing' 
        }

      case 'getUploadProgress':
        const u_progress = progressMap.get('upload')

        return {
            code: 200,
            progress: u_progress
        }

      default:
        return { 
          success: false, 
          message: 'Invalid action' 
        }
    }
  } catch (error) {
    console.error('Server error:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
})