import { GoogleGenerativeAI } from "@google/generative-ai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004", // 768 dimensions
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "BaseBallGames",
});

const pinecone = new PineconeClient({
  apiKey: useRuntimeConfig().pineconeApiKey,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Check if vector store exists
async function indexExists() {
  let indexList = await pinecone.listIndexes()
  
  return indexList.indexes.some(index => index.name === useRuntimeConfig().pineconeIndex);
}

let vectorStore;
async function storeExists() {
  if (!vectorStore) return false

  return true
}

// Check if vector store has uploaded data
let pineconeIndex;
async function indexTotalRecord() {
  if (!await indexExists()) return 0

  if (!pineconeIndex) pineconeIndex = pinecone.Index(useRuntimeConfig().pineconeIndex);
  let stats = await pineconeIndex.describeIndexStats()
  
  return stats.totalRecordCount
}

async function createVectorStore() {
  if (vectorStore) return
  if (!await indexExists()) return

  if (!pineconeIndex) pineconeIndex = pinecone.Index(useRuntimeConfig().pineconeIndex);

  vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });

  console.log(`Vector store created.`)
}


async function simulation(inputs) {
  try {
    const { inning, team1, team2, team1_tactics, team2_tactics, team1_lineup, team2_lineup, generatedGames } = inputs;
    // RAG检索
    const relevantDocs = await vectorStore.similaritySearch(
      `Teams: ${team1} vs ${team2}, ${team1} Tactics: ${team1_tactics}, ${team2} Tactics: ${team2_tactics}, ${team1} Lineup: ${team1_lineup}, ${team2} Lineup: ${team2_lineup}`,
      3
    );

    // 生成模拟提示
    const context = relevantDocs.map(doc => doc.pageContent).join('\n');
    const prompt = `
      Based on historical MLB games:
      ${context}

      Simulate a game:  
      - Team 1: ${team1}, Starting lineup: ${team1_lineup}, Tactical usage: ${team1_tactics}  
      - Team 2: ${team2}, Starting lineup: ${team2_lineup}, Tactical usage: ${team2_tactics}

      Include detailed inning-by-inning results and key player performances.

      Generated game events:
      ${generatedGames}

      Please strictly generate the ${inning}th inning game events according to the following JSON format example, including detailed hit coordinates and score changes.
      Example:
      {
        "inning": ${inning},
        "homeScore": 1,
        "awayScore": 0,
        "events": [
          {
            "type": "DOUBLE",
            "team": "away",
            "player": "Grant Holmes",
            "result": "Double to right field",
            "basesAdvanced": 2,
            "coordinates": {"x": 72, "y": 65},
            "runners": [
              {"from": 0, "to": 2, "player": "Grant Holmes"}
            ]
          },
          {
            "type": "SACRIFICE",
            "team": "away",
            "player": "Mike Trout",
            "result": "Sacrifice bunt advances runner",
            "outs": 1,
            "runners": [
              {"from": 2, "to": 3, "player": "Grant Holmes"}
            ]
          }
        ]
      }

      Events format:
      {
        type: // Event type
        inning: // Inning number
        team: // Team
        player: // Player
        result: // Event result
        runs: // Runs scored
        outs: // Outs recorded
        basesAdvanced: // Bases advanced
        coordinates: // Event coordinates
        runners: // Runner status
        {
          from: // Starting base
          to: // Destination base
          player: // Runner
        }
      }

      Allowed event types:
      [
        "SINGLE", "DOUBLE", "TRIPLE", "HOMERUN",
        "STRIKEOUT", "WALK", "HITBYPITCH", "SACRIFICE",
        "FLYOUT", "GROUNDOUT", "BUNT", "FIELDERSCHOICE",
        "STOLENBASE", "CAUGHTSTEALING", "ERROR",
        "DOUBLEPLAY", "TRIPLEPLAY"
      ]

      Generation requirements:  
      1. Each event must include type, team, player, result
      2. Each inning should contain 2-5 major events  
      3. Coordinate range x:0-100, y:0-100 (Home plate at (50,90), First base at (75,65), Second base at (50,40), Third base at (25,65))
      4. Include actual baserunner movement data
      5. Use English descriptions in result field
      6. Out count must follow game logic
    `;

    // 调用Gemini进行生成
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);

    // 解析Gemini响应
    const events = parseEvents(result.response);
    
    return {
      events
    };
  }
  catch (error) {
    console.log(error.message);
  }
}

// 解析Gemini响应
function parseEvents(geminiResponse) {
  try {
    const rawText = geminiResponse.text();
    
    // 使用正则表达式提取JSON部分
    const rawData = JSON.parse(rawText);
    if (!rawData) {
      throw new Error('Invalid response format');
    }
    
    // 数据校验函数
    const validateEvent = (event) => {
      const validTypes = [
        'SINGLE', 'DOUBLE', 'TRIPLE', 'HOMERUN',
        'STRIKEOUT', 'WALK', 'HITBYPITCH', 'SACRIFICE',
        'FLYOUT', 'GROUNDOUT', 'BUNT', 'FIELDERSCHOICE',
        'STOLENBASE', 'CAUGHTSTEALING', 'ERROR',
        'DOUBLEPLAY', 'TRIPLEPLAY'
      ];

      if (!validTypes.includes(event.type)) {
        throw new Error(`Invalid event type: ${event.type}`);
      }

      // 类型特定验证
      switch (event.type) {
        case 'STOLENBASE':
        case 'CAUGHTSTEALING':
          if (!event.runners) {
            throw new Error(`${event.type} event requires runners data`);
          }
          break;
          
        case 'DOUBLEPLAY':
        case 'TRIPLEPLAY':
          if (typeof event.outs !== 'number' || event.outs < 2) {
            throw new Error(`${event.type} must include at least 2 outs`);
          }
          break;
      }

      return {
        type: event.type,
        inning: Number(event.number),
        team: event.team === 'home' ? 'home' : 'away',
        player: String(event.player),
        result: String(event.result),
        runs: event.runs ? Number(event.runs) : undefined,
        outs: event.outs ? Number(event.outs) : undefined,
        basesAdvanced: event.basesAdvanced ? Number(event.basesAdvanced) : undefined,
        coordinates: event.coordinates ? {
          x: clamp(Number(event.coordinates.x), 0, 100),
          y: clamp(Number(event.coordinates.y), 0, 100)
        } : undefined,
        runners: event.runners?.map((r) => ({
          from: clamp(Number(r.from), 0, 3),
          to: clamp(Number(r.to), 0, 3),
          player: String(r.player)
        }))
      };
    };

    const clamp = (value, min, max) => 
      Math.min(Math.max(value, min), max);

    // 构建完整结果
    const result = {
      number: Number(rawData.number),
      homeScore: Number(rawData.homeScore),
      awayScore: Number(rawData.awayScore),
      events: rawData.events.map((e) => {
        try {
          return validateEvent(e);
        } catch (error) {
          console.error('Invalid event format:', e);
          return null;
        }
      }).filter(Boolean)
    };

    // 分数验证
    const totalRuns = result.events.reduce((sum, e) => sum + (e.runs || 0), 0);
    if (result.homeScore + result.awayScore !== totalRuns) {
      console.warn('Score mismatch, recalculating...');
      result.homeScore = result.events.filter(e => e.team === 'home').reduce((sum, e) => sum + (e.runs || 0), 0);
      result.awayScore = result.events.filter(e => e.team === 'away').reduce((sum, e) => sum + (e.runs || 0), 0);
    }

    return result;
  } catch (error) {
    console.error('Parsing failed:', error);
    return {
      number: 0,
      homeScore: 0,
      awayScore: 0,
      events: [{
        type: 'ERROR',
        inning: 0,
        team: 'home',
        player: 'System',
        result: 'Parsing error occurred'
      }]
    };
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { action, sessionId, team1, team2, team1_tactics, team2_tactics, team1_lineup, team2_lineup } = body;

    if (action === "checkIndexStatus") {
      await createVectorStore()

      return {
        code: 200,
        indexIsExists: await indexExists(),
        totalRecords: await indexTotalRecord(),
        storeIsExists: await storeExists()
      }
    }

    if (action === "createIndex") await createIndex()

    if (!await indexExists()) 
      return {
        code: 400,
        status: false,
        message: "Vector store is not ready"
      }
  
    if (!await indexTotalRecord() > 0)
      return {
        code: 400,
        status: false,
        message: "Vector store is empty"
      }
    
    if (!vectorStore) {
      return {
        code: 400,
        status: false,
        message: "Vector store is not initialized"
      }
    }

    if (action === "simulate") {
      try {
        // 模拟9局比赛
        const innings = [];
        for (let i = 1; i <= 9; i++) {
          const inningResult = await simulation({
            inning: i,
            team1: team1,
            team2: team2,
            team1_tactics: team1_tactics,
            team2_tactics: team2_tactics,
            team1_lineup: team1_lineup,
            team2_lineup: team2_lineup,
            generatedGames: JSON.stringify(innings)
          });
          
          innings.push({
            number: i,
            homeScore: inningResult.events.homeScore,
            awayScore: inningResult.events.awayScore,
            events: inningResult.events.events
          });
        }

        return {
          code: 200,
          innings: innings
        }
      }
      catch (error) {
        console.error(error);
        return {
          code: 400,
          status: false,
          message: "Simulation failed"
        }
      }
    }
  } 
  catch (error) {
    console.error(error);
  } 
});