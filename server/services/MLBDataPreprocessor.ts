import fs from 'fs-extra'
import path from 'path'

interface RAGEntry {
  pageContent: string
  metadata: any
}

interface ProgressCallback {
  (progress: {
    floder?: string
    currentGame?: number
    totalGames?: number
    status?: string
    error?: number
  }): void
}

class MLBDataPreprocessor {
  async processRawData(onProgress?: ProgressCallback): Promise<void> {
    const fullOutputDir = path.resolve('./datasets/processed_data')
    await fs.ensureDir(fullOutputDir)

    const ragData: RAGEntry[] = []

    const rawDataDir = path.resolve('./datasets/raw_data')
    const yearFolders = await fs.readdir(rawDataDir)
    let currentGame = 0
    let errorCount = 0

    for (const yearFolder of yearFolders) {
      const fullYearPath = path.join(rawDataDir, yearFolder)
      console.log(`Processing folder: ${fullYearPath}`)

      const gameFiles = await fs.readdir(fullYearPath)
      currentGame = 0
      for (const gameFile of gameFiles) {
        const fullGamePath = path.join(fullYearPath, gameFile)
        console.log(`Preprocessing ${gameFile}`)

        ++currentGame;
        onProgress?.({ 
          floder: yearFolder,
          currentGame: currentGame,
          totalGames: gameFiles.length,
          status: 'preprocessing',
          error: errorCount
        })

        try {
          const data = await fs.readJson(fullGamePath)

          const gameInfo = {
            game_id: data.game_id.toString() || 'No ID',
            date: data.date || 'Unknown Date',
            home_team: data.home_team,
            away_team: data.away_team,
            home_score: data.home_score || 0,
            away_score: data.away_score || 0,
            total_innings: data.total_innings || 0,
            key_players: data.key_players || [],
            game_events: data.game_events || []
          }

          // RAG Entry
          const ragEntry: RAGEntry = {
            pageContent: `${gameInfo.away_team} vs ${gameInfo.home_team} on ${gameInfo.date}. ` +
              `Final score: ${gameInfo.away_score}-${gameInfo.home_score}. ` +
              `Key players: ${data.key_players.map(p => p.name).filter(name => name !== 'Unknown Player').join(', ')}`,
            metadata: gameInfo
          }
          ragData.push(ragEntry)

        } catch (error) {
          console.error(`Error processing ${gameFile}:`, error)
          ++errorCount;
        }
      }
    }

    // 保存 RAG 數據
    const ragFilePath = path.join(fullOutputDir, 'rag_data.jsonl')
    const ragStream = fs.createWriteStream(ragFilePath)
    ragData.forEach(item => {
      ragStream.write(JSON.stringify(item) + '\n')
    })
    ragStream.end()

    onProgress?.({
      status: 'completed'
    })

    console.log(`Processed ${ragData.length} games`)
  }
}

export default MLBDataPreprocessor