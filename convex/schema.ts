import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.optional(v.string()),
    provider: v.string(), // 'google' | 'email'
    role: v.union(v.literal("admin"), v.literal("member")), // 'admin' | 'member'
    firstName: v.string(),
    lastName: v.string(),
    profilePicture: v.optional(v.string()),
    invitedBy: v.optional(v.id('users')),
    emailVerified: v.optional(v.boolean()),
    verificationToken: v.optional(v.string()),
    resetPasswordToken: v.optional(v.string()),
  }),
  projects: defineTable({
    name: v.string(),
    createdBy: v.id('users'),
    description: v.optional(v.string()),
    url: v.string(),
    authCredentials: v.optional(v.object({})),
    trashed: v.optional(v.boolean()),
  }),
  personas: defineTable({
    name: v.string(),
    description: v.string(),
    goals: v.optional(v.array(v.string())),
    frustrations: v.optional(v.array(v.string())),
    traits: v.optional(v.object({})),
    background: v.optional(v.string()),
    preferredDevices: v.optional(v.array(v.string())),
    gender: v.optional(v.union(
      v.literal("male"),
      v.literal("female"),
      v.literal("prefer not to say")
    )),
    createdBy: v.id('users'),
    avatarUrl: v.optional(v.string()),
  }),
  tests: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    project: v.id('projects'),
    persona: v.id('personas'),
    createdBy: v.id('users'),
    trashed: v.optional(v.boolean()),
    analysis: v.optional(v.array(v.object({}))),
  }),
  testruns: defineTable({
    test: v.id('tests'),
    persona: v.optional(v.id('personas')),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("cancelled")
    ), // 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled'
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdBy: v.id('users'),
    scheduledFor: v.optional(v.number()),
    parentScheduleId: v.optional(v.id('testschedules')),
    analysis: v.optional(v.object({})),
    browserUseTaskId: v.optional(v.string()),
    browserUseLiveUrl: v.optional(v.string()),
    browserUseOutput: v.optional(v.string()),
    browserUseSteps: v.optional(v.array(v.object({}))),
    browserUseStatus: v.optional(v.string()),
    browserUseCreatedAt: v.optional(v.number()),
    browserUseFinishedAt: v.optional(v.number()),
    stepsWithScreenshots: v.optional(v.array(v.object({}))),
    trashed: v.optional(v.boolean()),
    result: v.optional(v.union(
      v.literal("passed"),
      v.literal("failed"),
      v.literal("unknown")
    )), // Usability test result: 'passed' | 'failed' | 'unknown'
  }),
  artifacts: defineTable({
    testRun: v.id('testruns'),
    type: v.union(
      v.literal("recording"),
      v.literal("screenshot"),
      v.literal("step")
    ), // 'recording' | 'screenshot' | 'step'
    url: v.optional(v.string()),
    steps: v.optional(v.array(v.object({}))),
    screenshots: v.optional(v.array(v.string())),
    recordings: v.optional(v.array(v.string())),
    metadata: v.optional(v.object({})),
    createdBy: v.id('users'),
    source: v.optional(v.string()),
  }),
  batchPersonas: defineTable({
    name: v.string(),
    description: v.string(),
    personas: v.array(v.id('personas')),
    generationParams: v.optional(v.object({})),
    createdBy: v.id('users'),
  }),
  batchTests: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    project: v.id('projects'),
    batchPersona: v.id('batchPersonas'),
    test: v.id('tests'),
    testRuns: v.optional(v.array(v.id('testruns'))),
    createdBy: v.id('users'),
    trashed: v.optional(v.boolean()),
    analysis: v.optional(v.array(v.object({}))),
  }),
  testschedules: defineTable({
    test: v.id('tests'),
    persona: v.id('personas'),
    recurrenceRule: v.string(),
    nextRun: v.number(),
    active: v.boolean(),
    createdBy: v.id('users'),
  }),
  uxUiBestPractices: defineTable({
    title: v.string(),
    content: v.optional(v.string()),
    embedding: v.array(v.float64()),
    timestamp: v.number(),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536, // OpenAI text-embedding-3-small is 1536 dims
    filterFields: ["title"],
  }),
  agentMemories: defineTable({
    testId: v.string(),
    testRunId: v.string(),
    personaId: v.string(),
    text: v.string(),
    embedding: v.array(v.float64()),
    type: v.optional(v.string()),
    timestamp: v.number(),
    role: v.optional(v.union(v.literal("user"), v.literal("agent"))),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536, // OpenAI text-embedding-3-small is 1536 dims
    filterFields: ["testId", "testRunId", "personaId", "type"],
  }),
}); 