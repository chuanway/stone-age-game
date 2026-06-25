import fs from 'fs'
import path from 'path'
import { env } from './env'
import type {
  BuildingsConfig,
  MonstersConfig,
  BattleConfig,
  ClanConfig,
  GameConfig,
  ArmouryConfig,
  ConfigName,
} from 'shared'

const configCache = new Map<ConfigName, unknown>()

function resolveConfigPath(): string {
  return path.resolve(__dirname, '../../', env.configPath)
}

function loadConfig<T>(name: ConfigName): T {
  if (env.nodeEnv === 'development') {
    configCache.delete(name)
  }
  const cached = configCache.get(name) as T | undefined
  if (cached) return cached

  const filePath = path.resolve(resolveConfigPath(), `${name}.json`)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(raw) as T
  configCache.set(name, parsed)
  return parsed
}

export function loadBuildingsConfig(): BuildingsConfig {
  return loadConfig<BuildingsConfig>('buildings')
}

export function loadMonstersConfig(): MonstersConfig {
  return loadConfig<MonstersConfig>('monsters')
}

export function loadBattleConfig(): BattleConfig {
  return loadConfig<BattleConfig>('battle')
}

export function loadClanConfig(): ClanConfig {
  return loadConfig<ClanConfig>('clan')
}

export function loadGameConfig(): GameConfig {
  return loadConfig<GameConfig>('game')
}

export function loadArmouryConfig(): ArmouryConfig {
  return loadConfig<ArmouryConfig>('armoury')
}

export function clearConfigCache(): void {
  configCache.clear()
}

export function reloadAllConfigs(): void {
  configCache.clear()
  loadBuildingsConfig()
  loadMonstersConfig()
  loadBattleConfig()
  loadClanConfig()
  loadGameConfig()
  loadArmouryConfig()
}
