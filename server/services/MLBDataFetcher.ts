import axios, { AxiosInstance } from 'axios'
import fs from 'fs-extra'
import path from 'path'
import PQueue from 'p-queue';

interface GameData {
  game_pk: number
  date: string
  status: string
  teams: {
    home: string
    away: string
  }
}

interface ProcessedGameData {
  game_id: string
  date: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  total_innings: number
  key_players: any[]
  game_events: any[]
}

interface ProgressCallback {
  (progress: {
    currentGame?: number
    totalGames?: number
    status?: string
    error?: number
  }): void
}

class MLBDataFetcher {
  private client: AxiosInstance
  private baseUrl = 'https://statsapi.mlb.com/api'
  private maxRetries = 5
  private baseTimeout = 15000 // 15 seconds

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'User-Agent': 'MLB Simulator Data Collector/1.0'
      }
    })
  }

  private async fetchWithRetry<T>(
    url: string, 
    params?: Record<string, any>, 
    retries = 0
  ): Promise<T | null> {
    try {
      const response = await this.client.get(url, { 
        params,
        timeout: this.baseTimeout * (retries + 1)
      })
      return response.data
    } catch (error) {
      if (retries < this.maxRetries) {
        console.log(`Retry attempt ${retries + 1} for ${url}`)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)))
        return this.fetchWithRetry(url, params, retries + 1)
      }
      console.error(`Failed to fetch ${url}:`, error)
      return null
    }
  }

  async getGamesByDateRange(startDate: string, endDate: string): Promise<GameData[]> {
    const url = '/v1/schedule'
    const params = {
      sportId: 1,
      startDate,
      endDate,
      hydrate: 'game(content(summary)),linescore'
    }

    const data = await this.fetchWithRetry(url, params)
    return this.processScheduleData(data)
  }

  private getMonthlyDateRanges(startDate: string, endDate: string): Array<{start: Date, end: Date}> {
    const ranges: Array<{start: Date, end: Date}> = []
    let currentDate = new Date(startDate)
    const finalDate = new Date(endDate)

    while (currentDate <= finalDate) {
      // Set to first day of current month
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      
      // Get last day of current month
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      // Ensure we don't exceed the final date
      const rangeEnd = monthEnd > finalDate ? finalDate : monthEnd
      
      ranges.push({
        start: monthStart,
        end: rangeEnd
      })

      // Move to first day of next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    }

    return ranges
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private processScheduleData(data: any): GameData[] {
    if (!data?.dates) return []

    return data.dates.flatMap(date => 
      date.games.map(game => ({
        game_pk: game.gamePk,
        date: game.officialDate,
        status: game.status.detailedState,
        teams: {
          home: game.teams.home.team.name,
          away: game.teams.away.team.name
        }
      }))
    )
  }

  async getGameFeed(gamePk: number): Promise<ProcessedGameData | null> {
    const url = `/v1.1/game/${gamePk}/feed/live`
    const params = { 
      hydrate: 'plays(all),scoringplays,credits,alignment' 
    }

    const data = await this.fetchWithRetry(url, params)
    return this.processGameData(data)
  }

  private processGameData(data: any): ProcessedGameData | null {
    if (!data) return null

    const gameData = data.gameData || {}
    const liveData = data.liveData || {}

    const players = Object.values(gameData.players || {}).map((player: any) => ({
      name: player.fullName || 'Unknown Player',
      position: player.primaryPosition?.abbreviation || 'Unknown Position',
      id: player.id,
      batSide: player.batSide?.code || 'Unknown',
      pitchHand: player.pitchHand?.code || 'Unknown'
    }))

    const gameEvents = (liveData.plays?.allPlays || []).map((play: any) => ({
      inning: play.about?.inning || 0,
      description: play.result?.description || 'No Description',
      batter: play.matchup?.batter?.fullName || 'Unknown Batter',
      pitcher: play.matchup?.pitcher?.fullName || 'Unknown Pitcher'
    }))

    return {
      game_id: data.gamePk?.toString() || '無ID',
      date: gameData.datetime?.originalDate || '未知日期',
      home_team: gameData.teams?.home?.name || '未知主隊',
      away_team: gameData.teams?.away?.name || '未知客隊',
      home_score: liveData.linescore?.teams?.home?.runs || 0,
      away_score: liveData.linescore?.teams?.away?.runs || 0,
      total_innings: liveData.linescore?.innings?.length || 0,
      key_players: players,
      game_events: gameEvents
    }
  }

  async fetchHistoricalGames(
    startDate: string, 
    endDate: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    const dateRanges = this.getMonthlyDateRanges(startDate, endDate)
    const queue = new PQueue({concurrency: 50, autoStart: false});
    let total = 0

    for (const [monthIndex, range] of dateRanges.entries()) {
      const monthStr = range.start.toISOString().slice(0, 7) // YYYY-MM
      const yearStr = range.start.getFullYear().toString()
      
      // Create output directory for the year
      const outputDir = path.resolve(
        `./datasets/raw_data/${yearStr}_games`
      )
      await fs.ensureDir(outputDir)

      // Get games for the current month
      const games = await this.getGamesByDateRange(
        this.formatDate(range.start),
        this.formatDate(range.end)
      )

      console.log(`Found ${games.length} games for ${monthStr}`)

      // Process games for the current month
      let currentCount = 0;
      let errorCount = 0;
      queue.on('next', () => {
        ++currentCount;

        onProgress?.({
          currentGame: currentCount,
          totalGames: total,
          status: 'processing',
          error: errorCount
        });
      });

      queue.on('error', error => {
        ++errorCount;
        console.error(error);

        onProgress?.({
          status: 'error',
          currentGame: currentCount,
          totalGames: total,
          error: errorCount
        });
      });

      queue.on('idle', () => {
        console.log('Completed');

        onProgress?.({
          currentGame: currentCount,
          totalGames: total,
          status: 'completed',
          error: errorCount
        });
      });

      for (const game of games) {
        queue.add(async () => {
          const detailedData = await this.getGameFeed(game.game_pk)
          if (detailedData) {
            const filename = path.join(outputDir, `${game.game_pk}.json`)
            await fs.writeJson(filename, detailedData, { spaces: 2 })

            console.log(`Successfully saved ${filename}`)
          }
        })
      }
    }

    total = queue.size
    queue.start()
  }
}

export default MLBDataFetcher